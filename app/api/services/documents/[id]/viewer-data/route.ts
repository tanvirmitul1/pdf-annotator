import { NextRequest, NextResponse } from "next/server"

import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { NotFoundError } from "@/lib/errors"
import { track } from "@/lib/analytics"
import { mainQueue } from "@/lib/jobs/queue"
import {
  getAccessibleDocument,
  listDocumentCollaborators,
} from "@/lib/db/repositories/document-access"

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(_req)
  const document = await getAccessibleDocument(identity.userId, id)

  if (!document) throw new NotFoundError("Document")

  if (document.status === "PROCESSING") {
    const existing = await mainQueue.getJob(id)
    if (!existing) {
      await mainQueue.add(
        "document.postProcess",
        { documentId: id },
        { jobId: id }
      )
    }
  }

  // Fetch data with safe defaults for objects metadata
  const [outline, bookmarks, readingProgress, collaborators, pagesDataRaw] = await Promise.all([
    prisma.documentOutline.findUnique({
      where: { documentId: id },
      select: { entries: true },
    }).catch(() => null),
    prisma.bookmark.findMany({
      where: { documentId: id, userId: identity.userId },
      orderBy: { pageNumber: "asc" },
    }).catch(() => []),
    prisma.readingProgress.findUnique({
      where: { userId_documentId: { userId: identity.userId, documentId: id } },
    }).catch(() => null),
    listDocumentCollaborators(id).catch(() => []),
    prisma.documentText.findMany({
      where: { documentId: id },
      select: { pageNumber: true, objects: true },
    }).catch(() => [])
  ])

  // Sanitize pagesData to ensure objects is always an array
  const pagesData = pagesDataRaw.map(p => ({
    ...p,
    objects: Array.isArray(p.objects) ? p.objects : []
  }))

  // Update lastOpenedAt
  void prisma.document.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  })

  track(identity.userId, "document_opened", {
    documentId: id,
    pageCount: document.pageCount ?? 0,
  })

  // Calculate permissions - ensure owner always gets full permissions
  const isDocumentOwner = document.userId === identity.userId
  const role = isDocumentOwner ? "OWNER" : document.role
  
  return NextResponse.json({
    data: {
      document,
      collaborators,
      permissions: {
        role,
        canInviteMembers: role === "OWNER" || role === "EDITOR",
        canManageMembers: role === "OWNER",
        canAnnotate: true,
      },
      outline: outline?.entries ?? null,
      bookmarks,
      readingProgress,
      pagesData,
    },
  })
}

export const GET = withErrorHandling(getHandler)
