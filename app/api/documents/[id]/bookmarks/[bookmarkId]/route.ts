import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"
import { getIpAddress } from "@/lib/request"
import { UpdateBookmarkSchema } from "@/features/bookmarks/schema"

async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bookmarkId: string }> }
) {
  const { id, bookmarkId } = await params
  const user = await requireUser()

  await enforceRateLimit(req, user.id, "default")

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: user.id, documentId: id },
  })
  if (!bookmark) throw new NotFoundError("Bookmark")

  const input = UpdateBookmarkSchema.parse(await req.json())

  const updated = await prisma.bookmark.update({
    where: { id: bookmarkId },
    data: { label: input.label },
  })

  await logAudit({
    userId: user.id,
    action: "bookmark.update",
    resourceType: "Bookmark",
    resourceId: bookmarkId,
    metadata: { documentId: id, label: input.label },
    ipAddress: getIpAddress(req),
  })

  return NextResponse.json({ data: updated })
}

async function deleteHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bookmarkId: string }> }
) {
  const { id, bookmarkId } = await params
  const user = await requireUser()

  await enforceRateLimit(req, user.id, "default")

  const bookmark = await prisma.bookmark.findFirst({
    where: { id: bookmarkId, userId: user.id, documentId: id },
  })
  if (!bookmark) throw new NotFoundError("Bookmark")

  await prisma.bookmark.delete({ where: { id: bookmarkId } })

  await logAudit({
    userId: user.id,
    action: "bookmark.delete",
    resourceType: "Bookmark",
    resourceId: bookmarkId,
    metadata: { documentId: id },
    ipAddress: getIpAddress(req),
  })

  return new NextResponse(null, { status: 204 })
}

export const PATCH = withErrorHandling(patchHandler)
export const DELETE = withErrorHandling(deleteHandler)
