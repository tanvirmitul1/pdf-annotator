import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { NotFoundError } from "@/lib/errors"
import { track } from "@/lib/analytics"
import { mainQueue } from "@/lib/jobs/queue"

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      pageCount: true,
      status: true,
      storageKey: true,
      thumbnailKey: true,
    },
  })

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

  const [outline, bookmarks, readingProgress] = await Promise.all([
    prisma.documentOutline.findUnique({
      where: { documentId: id },
      select: { entries: true },
    }),
    prisma.bookmark.findMany({
      where: { documentId: id, userId: user.id },
      orderBy: { pageNumber: "asc" },
    }),
    prisma.readingProgress.findUnique({
      where: { userId_documentId: { userId: user.id, documentId: id } },
    }),
  ])

  // Update lastOpenedAt
  void prisma.document.update({
    where: { id },
    data: { lastOpenedAt: new Date() },
  })

  track(user.id, "document_opened", {
    documentId: id,
    pageCount: document.pageCount ?? 0,
  })

  return NextResponse.json({
    data: {
      document,
      outline: outline?.entries ?? null,
      bookmarks,
      readingProgress,
    },
  })
}

export const GET = withErrorHandling(getHandler)
