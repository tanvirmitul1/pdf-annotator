import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { PDFDocument, degrees } from "pdf-lib"
import { Readable } from "stream"

import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { createStorageAdapter } from "@/lib/storage"
import { logAudit } from "@/lib/audit"

const PageOrderSchema = z.array(
  z.object({
    originalIndex: z.number().optional(),
    type: z.enum(["original", "blank"]),
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    deleted: z.boolean().optional(),
  })
)

async function organizeHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  const body = await request.json()
  const validation = PageOrderSchema.safeParse(body)
  if (!validation.success) {
    return NextResponse.json({ error: "Invalid page order" }, { status: 400 })
  }

  const pageOrder = validation.data

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const storage = createStorageAdapter()
  const pdfStream = await storage.get(document.storageKey)
  
  // Convert stream to Buffer
  const chunks: Buffer[] = []
  for await (const chunk of pdfStream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
  }
  const pdfBuffer = Buffer.concat(chunks)

  // Load PDF with pdf-lib
  const srcDoc = await PDFDocument.load(pdfBuffer)
  const newDoc = await PDFDocument.create()

  // Copy pages in the specified order with rotation
  for (const pageInfo of pageOrder) {
    if (pageInfo.deleted) continue

    if (pageInfo.type === "blank") {
      const page = newDoc.addPage([612, 792]) // Standard US Letter size
      if (pageInfo.rotation !== 0) {
        page.setRotation(degrees(pageInfo.rotation))
      }
    } else {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [pageInfo.originalIndex! - 1])
      if (pageInfo.rotation !== 0) {
        const currentRot = copiedPage.getRotation().angle
        copiedPage.setRotation(degrees((currentRot + pageInfo.rotation) % 360))
      }
      newDoc.addPage(copiedPage)
    }
  }

  const organizedPdfBuffer = Buffer.from(await newDoc.save())
  
  // Upload the new PDF (overwriting for now or creating a version)
  // To be safe and compatible with existing system, we'll overwrite the original storage key 
  // but we could also upload as a new key and update the Document record.
  // Given SmallPDF behavior, it's usually a destructive change unless there's history.
  
  const uploadStream = Readable.from(organizedPdfBuffer)
  const { key: newKey, size: newSize } = await storage.upload(
    user.id,
    id,
    uploadStream,
    "application/pdf",
    document.name.endsWith(".pdf") ? document.name : `${document.name}.pdf`
  )

  // Update DB: pageCount, pageOrder, fileSize, and storageKey if changed
  await prisma.$transaction(async (tx) => {
    // Update document metadata
    await tx.document.update({
      where: { id },
      data: {
        pageCount: newDoc.getPageCount(),
        fileSize: newSize,
        storageKey: newKey,
        pageOrder: pageOrder as unknown as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    })

    // If we reorder, the existing DocumentText and Annotation pageNumbers are now WRONG.
    // For Annotations, we should either re-map them or clear them.
    // SmallPDF usually keeps annotations attached to the ORIGINAL page content.
    // So if page 2 becomes page 1, the annotations on page 2 should now be on page 1.
    
    // Simple approach for this MVP: 
    // 1. Get all annotations for this document
    // 2. Map their pageNumber based on the new order
    // 3. Delete annotations that was on a deleted page
    
    const annotations = await tx.annotation.findMany({
      where: { documentId: id },
    })

    for (const ann of annotations) {
      // Find where the original page went
      const newPageIndex = pageOrder.findIndex(p => p.originalIndex === ann.pageNumber && !p.deleted)
      
      if (newPageIndex === -1) {
        // Page was deleted
        await tx.annotation.delete({ where: { id: ann.id } })
      } else {
        // Page moved to newPageIndex + 1
        await tx.annotation.update({
          where: { id: ann.id },
          data: { pageNumber: newPageIndex + 1 },
        })
      }
    }
    
    // Similarly for DocumentText
    await tx.documentText.deleteMany({ where: { documentId: id } })
    // We should re-extract text, but for now we'll leave it empty to be re-processed or handled on next load
  })

  await logAudit({
    userId: user.id,
    action: "document.organize",
    resourceType: "document",
    resourceId: id,
    metadata: { pageCount: newDoc.getPageCount(), deletedPages: pageOrder.filter(p => p.deleted).length },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ success: true, pageCount: newDoc.getPageCount() })
}

export const POST = withErrorHandling(organizeHandler)
