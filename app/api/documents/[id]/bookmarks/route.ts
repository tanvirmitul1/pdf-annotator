import { NextRequest, NextResponse } from "next/server"

import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"
import { getIpAddress } from "@/lib/request"
import { CreateBookmarkSchema } from "@/features/bookmarks/schema"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(_req)

  const doc = await getAccessibleDocument(identity.userId, id)
  if (!doc) throw new NotFoundError("Document")

  const bookmarks = await prisma.bookmark.findMany({
    where: { documentId: id, userId: identity.userId },
    orderBy: { pageNumber: "asc" },
  })

  return NextResponse.json({ data: bookmarks })
}

async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(req)

  await enforceRateLimit(req, identity.userId, "default")

  const doc = await getAccessibleDocument(identity.userId, id)
  if (!doc) throw new NotFoundError("Document")

  const input = CreateBookmarkSchema.parse(await req.json())

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: identity.userId,
      documentId: id,
      pageNumber: input.pageNumber,
      label: input.label ?? null,
    },
  })

  await logAudit({
    userId: identity.userId,
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
