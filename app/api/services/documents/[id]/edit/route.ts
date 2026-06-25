import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { createStorageAdapter } from "@/lib/storage"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"
import { prisma } from "@/lib/db/prisma"
import { applyTextEditsToPdf } from "@/lib/pdf/edit"
import { mainQueue } from "@/lib/jobs/queue"
import { Readable } from "stream"
import { z } from "zod"

const editSchema = z.object({
  edits: z.array(z.object({
    pageNumber: z.number().min(1),
    x: z.number(),
    y: z.number(),
    width: z.number(),
    height: z.number(),
    text: z.string(),
    fontSize: z.number(),
    fontFamily: z.string(),
    color: z.string(),
  }))
})

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const identity = await requireRequestIdentity(request)
  const body = await request.json()
  const { edits } = editSchema.parse(body)

  const document = await getAccessibleDocument(identity.userId, id)
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const storage = createStorageAdapter()
  const originalStream = await storage.get(document.storageKey)
  const originalBuffer = await streamToBuffer(originalStream)

  // Apply edits
  const editedBuffer = await applyTextEditsToPdf(originalBuffer, edits)

  // Upload edited document
  const { key: uploadedKey } = await storage.upload(
    document.userId,
    document.id,
    Readable.from(editedBuffer),
    "application/pdf",
    document.name
  )

  // Update document status and storage key
  await prisma.document.update({
    where: { id: document.id },
    data: {
      storageKey: uploadedKey,
      status: "PROCESSING",
      processingProgress: 0,
    },
  })

  // Re-trigger post-processing to update text layer and thumbnails
  await mainQueue.add("document.postProcess", { documentId: id }, { attempts: 3, backoff: 5000 })

  return NextResponse.json({ success: true, storageKey: uploadedKey })
}

export const POST = withErrorHandling(handler)
