import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { NotFoundError, ForbiddenError } from "@/lib/errors"
import { withErrorHandling } from "@/lib/api/handler"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"
import {
  createShareLink,
  getActiveShareLink,
} from "@/lib/db/repositories/share-links"

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId } = await params
  const doc = await getAccessibleDocument(session.user.id, documentId)
  if (!doc) throw new NotFoundError("Document")

  if (doc.role !== "OWNER") {
    throw new ForbiddenError("Only owners can manage public links")
  }

  const link = await getActiveShareLink(documentId)
  return NextResponse.json({ shareLink: link })
}

async function postHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId } = await params
  const doc = await getAccessibleDocument(session.user.id, documentId)
  if (!doc) throw new NotFoundError("Document")

  if (doc.role !== "OWNER") {
    throw new ForbiddenError("Only owners can manage public links")
  }

  const existing = await getActiveShareLink(documentId)
  if (existing) {
    return NextResponse.json({ shareLink: existing })
  }

  const link = await createShareLink(documentId, session.user.id)
  return NextResponse.json({ shareLink: link })
}

export const GET = withErrorHandling(getHandler)
export const POST = withErrorHandling(postHandler)
