import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { NotFoundError, ForbiddenError } from "@/lib/errors"
import { withErrorHandling } from "@/lib/api/handler"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"
import { revokeShareLink } from "@/lib/db/repositories/share-links"

async function deleteHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId, linkId } = await params
  const doc = await getAccessibleDocument(session.user.id, documentId)
  if (!doc) throw new NotFoundError("Document")

  if (doc.role !== "OWNER") {
    throw new ForbiddenError("Only owners can manage public links")
  }

  await revokeShareLink(linkId)
  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler)
