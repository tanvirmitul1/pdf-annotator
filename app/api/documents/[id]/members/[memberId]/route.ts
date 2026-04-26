import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { NotFoundError, ForbiddenError } from "@/lib/errors"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"

const updateRoleSchema = z.object({
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]),
})

/** PATCH /api/documents/[id]/members/[memberId] - Update member role */
async function patchHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId, memberId } = await params
  
  // Check if user is owner
  const document = await getAccessibleDocument(session.user.id, documentId)
  if (!document) {
    throw new NotFoundError("Document")
  }

  if (document.role !== "OWNER") {
    throw new ForbiddenError("Only owners can change member roles")
  }

  // Can't change owner's role
  if (memberId === "owner") {
    return NextResponse.json(
      { error: "Cannot change the owner's role" },
      { status: 400 }
    )
  }

  const body = await req.json()
  const parsed = updateRoleSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { role } = parsed.data

  // Update the member
  const member = await prisma.documentMember.update({
    where: {
      id: memberId,
      documentId,
    },
    data: { role },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  })

  return NextResponse.json({
    data: {
      ...member,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    },
  })
}

/** DELETE /api/documents/[id]/members/[memberId] - Remove member */
async function deleteHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId, memberId } = await params
  
  // Check if user is owner
  const document = await getAccessibleDocument(session.user.id, documentId)
  if (!document) {
    throw new NotFoundError("Document")
  }

  if (document.role !== "OWNER") {
    throw new ForbiddenError("Only owners can remove members")
  }

  // Can't remove owner
  if (memberId === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the owner" },
      { status: 400 }
    )
  }

  // Remove the member
  await prisma.documentMember.delete({
    where: {
      id: memberId,
      documentId,
    },
  })

  return NextResponse.json({ data: { success: true } })
}

export const PATCH = withErrorHandling(patchHandler)
export const DELETE = withErrorHandling(deleteHandler)
