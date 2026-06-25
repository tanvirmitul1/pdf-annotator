import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { logAudit } from "@/lib/audit"
import { decrementUsage } from "@/lib/authz/plan"
import { createStorageAdapter } from "@/lib/storage"

const UpdateDocumentSchema = z.object({
  name: z.string().min(1).max(255),
})

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
    include: {
      _count: {
        select: {
          annotations: true,
          bookmarks: true,
        },
      },
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Update lastOpenedAt
  await prisma.document.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  })

  return NextResponse.json(document)
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const body = await request.json()
  const validation = UpdateDocumentSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 })
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const updatedDocument = await prisma.document.update({
    where: { id },
    data: { name: validation.data.name },
  })

  await logAudit({
    userId: user.id,
    action: "document.update",
    resourceType: "document",
    resourceId: id,
    metadata: { name: validation.data.name },
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json(updatedDocument)
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  // Get document (including already deleted ones for cleanup)
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
    },
    include: {
      annotations: {
        include: {
          comments: true,
          tags: true,
        },
      },
      bookmarks: true,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const storage = createStorageAdapter()

  // Delete all files from storage
  try {
    const documentPrefix = `${user.id}/${id}`
    await storage.deletePrefix(documentPrefix)
    await storage.delete(document.storageKey)
    if (document.thumbnailKey) {
      await storage.delete(document.thumbnailKey)
    }
  } catch (error) {
    console.error(`Failed to delete storage files for document ${id}:`, error)
  }

  // Delete all related data from database in a transaction
  await prisma.$transaction(async (tx) => {
    const annotationIds = document.annotations.map((a) => a.id)
    if (annotationIds.length > 0) {
      await tx.annotationComment.deleteMany({
        where: { annotationId: { in: annotationIds } },
      })
      await tx.annotationTag.deleteMany({
        where: { annotationId: { in: annotationIds } },
      })
      await tx.annotation.deleteMany({
        where: { id: { in: annotationIds } },
      })
    }

    await tx.bookmark.deleteMany({ where: { documentId: id } })
    await tx.documentText.deleteMany({ where: { documentId: id } })
    await tx.documentOutline.deleteMany({ where: { documentId: id } })
    await tx.readingProgress.deleteMany({ where: { documentId: id } })
    await tx.shareLink.deleteMany({ where: { documentId: id } })
    await tx.documentMember.deleteMany({ where: { documentId: id } })
    await tx.documentCollection.deleteMany({ where: { documentId: id } })
    await tx.document.delete({ where: { id } })
  })

  // Decrement usage
  await decrementUsage(user.id, "DOCUMENTS", 1)
  await decrementUsage(user.id, "STORAGE_MB", Math.ceil(document.fileSize / (1024 * 1024)))

  await logAudit({
    userId: user.id,
    action: "document.hard_delete",
    resourceType: "document",
    resourceId: id,
    metadata: {
      documentName: document.name,
      fileSize: document.fileSize,
      annotationCount: document.annotations.length,
    },
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ 
    success: true,
    message: "Document permanently deleted"
  })
}

export const GET = withErrorHandling(getHandler)
export const PATCH = withErrorHandling(patchHandler)
export const DELETE = withErrorHandling(deleteHandler)