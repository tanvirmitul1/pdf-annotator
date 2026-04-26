import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { logAudit } from "@/lib/audit"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { decrementUsage } from "@/lib/authz/plan"
import { prisma } from "@/lib/db/prisma"
import { createStorageAdapter } from "@/lib/storage"

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  // Get document with all related data
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
    // Delete all files with the document prefix (userId/documentId/*)
    const documentPrefix = `${user.id}/${id}`
    await storage.deletePrefix(documentPrefix)

    // Also delete individual keys as backup
    await storage.delete(document.storageKey)
    if (document.thumbnailKey) {
      await storage.delete(document.thumbnailKey)
    }
  } catch (error) {
    console.error(`Failed to delete storage files for document ${id}:`, error)
    // Continue with database deletion even if storage deletion fails
  }

  // Delete all related data from database in correct order
  await prisma.$transaction(async (tx) => {
    // Delete annotation comments
    const annotationIds = document.annotations.map((a) => a.id)
    if (annotationIds.length > 0) {
      await tx.annotationComment.deleteMany({
        where: {
          annotationId: {
            in: annotationIds,
          },
        },
      })

      // Delete annotation tags
      await tx.annotationTag.deleteMany({
        where: {
          annotationId: {
            in: annotationIds,
          },
        },
      })

      // Delete annotations
      await tx.annotation.deleteMany({
        where: {
          id: {
            in: annotationIds,
          },
        },
      })
    }

    // Delete bookmarks
    await tx.bookmark.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete document text pages
    await tx.documentText.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete document outline
    await tx.documentOutline.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete reading progress
    await tx.readingProgress.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete share links
    await tx.shareLink.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete document members
    await tx.documentMember.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Delete document from collections
    await tx.documentCollection.deleteMany({
      where: {
        documentId: id,
      },
    })

    // Finally, delete the document itself (hard delete)
    await tx.document.delete({
      where: { id },
    })
  })

  // Decrement usage
  await decrementUsage(user.id, "DOCUMENTS", 1)
  await decrementUsage(
    user.id,
    "STORAGE_MB",
    Math.ceil(document.fileSize / (1024 * 1024))
  )

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
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
  })

  return NextResponse.json({ 
    success: true,
    message: "Document permanently deleted"
  })
}

export const DELETE = withErrorHandling(handler)
