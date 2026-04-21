import { NextRequest, NextResponse } from "next/server"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"
import { getIpAddress } from "@/lib/request"
import { CreateBookmarkSchema } from "@/features/bookmarks/schema"

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const bookmarks = await prisma.bookmark.findMany({
    where: { documentId: id, userId: user.id },
    orderBy: { pageNumber: "asc" },
  })

  return NextResponse.json({ data: bookmarks })
}

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  await enforceRateLimit(req, user.id, "default")

  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const input = CreateBookmarkSchema.parse(await req.json())

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: user.id,
      documentId: id,
      pageNumber: input.pageNumber,
      label: input.label ?? null,
    },
  })

  await logAudit({
    userId: user.id,
    action: "bookmark.create",
    resourceType: "Bookmark",
    resourceId: bookmark.id,
    metadata: { documentId: id, pageNumber: input.pageNumber },
    ipAddress: getIpAddress(req),
  })

  return NextResponse.json({ data: bookmark }, { status: 201 })
}

export const GET = withErrorHandling(getHandler)
export const POST = withErrorHandling(postHandler)
