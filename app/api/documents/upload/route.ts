import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"

import { Readable } from "stream"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { assertCanPerform } from "@/lib/authz/assert"
import { getPlan, getUsage, incrementUsage } from "@/lib/authz/plan"
import { getDeviceCookieOptions, resolveIdentityFromRequest } from "@/lib/device/identity"
import { createStorageAdapter } from "@/lib/storage"
import { mainQueue } from "@/lib/jobs/queue"
import { logAudit } from "@/lib/audit"
import { QuotaExceededError } from "@/lib/errors"
import { getIpAddress } from "@/lib/request"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const UploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= MAX_FILE_SIZE,
    "File size must be less than 50MB"
  ).refine(
    (file) => ["application/pdf", "image/png", "image/jpeg", "image/webp"].includes(file.type),
    "File must be a PDF or image"
  ),
})

async function handler(request: NextRequest) {
  const session = await auth()
  const identity = await resolveIdentityFromRequest(request, session?.user?.id ?? null)
  const ipAddress = getIpAddress(request)

  const formData = await request.formData()
  const file = formData.get("file") as File

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  // Validate file
  const validation = UploadSchema.safeParse({ file })
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
  }

  // Check quota
  const plan = await getPlan(identity.userId)
  const currentDocuments = await getUsage(identity.userId, "DOCUMENTS")
  const currentStorageMB = await getUsage(identity.userId, "STORAGE_MB")

  if (currentDocuments >= plan.maxDocuments) {
    return NextResponse.json({ error: "Document quota exceeded" }, { status: 402 })
  }

  const fileSizeMB = Math.ceil(file.size / (1024 * 1024))
  if (currentStorageMB + fileSizeMB > plan.maxStorageMB) {
    return NextResponse.json({ error: "Storage quota exceeded" }, { status: 402 })
  }

  try {
    await assertCanPerform(identity.userId, "document.create")
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json({ error: "Quota exceeded" }, { status: 402 })
    }
    throw error
  }

  // Generate document ID
  const documentId = randomUUID()

  // Create document record
  const document = await prisma.document.create({
    data: {
      id: documentId,
      userId: identity.userId,
      name: file.name,
      fileSize: file.size,
      storageKey: `${identity.userId}/${documentId}/original`,
      status: "PROCESSING",
    },
  })

  // Upload file
  const storage = createStorageAdapter()
  const stream = Readable.from(file.stream() as unknown as AsyncIterable<Uint8Array>)
  await storage.upload(identity.userId, documentId, stream, file.type, "original")

  // Increment usage
  await incrementUsage(identity.userId, "DOCUMENTS", 1)
  await incrementUsage(identity.userId, "STORAGE_MB", fileSizeMB)

  // Enqueue processing job (idempotent per document)
  await mainQueue.add(
    "document.postProcess",
    { documentId },
    { jobId: documentId }
  )

  // Audit log
  await logAudit({
    userId: identity.userId,
    action: "document.create",
    resourceType: "document",
    resourceId: documentId,
    metadata: { fileSize: file.size, contentType: file.type, isAnonymous: identity.isAnonymous },
    ipAddress,
  })

  const response = NextResponse.json({
    document,
    isAnonymous: identity.isAnonymous,
  })

  if (identity.isAnonymous && identity.cookieWasCreated) {
    response.cookies.set({
      ...getDeviceCookieOptions(),
      value: identity.deviceToken,
    })
  }

  return response
}

export const POST = withErrorHandling(handler)
