import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { NotFoundError, ForbiddenError } from "@/lib/errors"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(["VIEWER", "COMMENTER", "EDITOR"]).default("VIEWER"),
})

/** GET /api/documents/[id]/members - List all members */
async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId } = await params
  
  // Check if user has access to the document
  const document = await getAccessibleDocument(session.user.id, documentId)
  if (!document) {
    throw new NotFoundError("Document")
  }

  // Get all members
  const members = await prisma.documentMember.findMany({
    where: { documentId },
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
    orderBy: { createdAt: "asc" },
  })

  // Add owner to the list
  const owner = await prisma.user.findUnique({
    where: { id: document.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
  })

  const membersWithOwner = [
    {
      id: "owner",
      userId: document.userId,
      role: "OWNER" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: owner!,
    },
    ...members.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    })),
  ]

  return NextResponse.json({ data: membersWithOwner })
}

/** POST /api/documents/[id]/members - Invite a new member */
async function postHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: documentId } = await params
  
  // Check if user has access and is owner/editor
  const document = await getAccessibleDocument(session.user.id, documentId)
  if (!document) {
    throw new NotFoundError("Document")
  }

  if (document.role !== "OWNER" && document.role !== "EDITOR") {
    throw new ForbiddenError("Only owners and editors can invite members")
  }

  const body = await req.json()
  const parsed = inviteMemberSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { email, role } = parsed.data

  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    return NextResponse.json(
      { error: "User not found. They need to create an account first." },
      { status: 404 }
    )
  }

  // Check if already a member
  const existingMember = await prisma.documentMember.findUnique({
    where: {
      documentId_userId: {
        documentId,
        userId: user.id,
      },
    },
  })

  if (existingMember) {
    return NextResponse.json(
      { error: "User is already a member of this document" },
      { status: 409 }
    )
  }

  // Can't invite the owner
  if (user.id === document.userId) {
    return NextResponse.json(
      { error: "Cannot invite the document owner" },
      { status: 400 }
    )
  }

  // Create the member
  const member = await prisma.documentMember.create({
    data: {
      documentId,
      userId: user.id,
      role,
    },
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

  // TODO: Send email notification to invited user

  return NextResponse.json(
    {
      data: {
        ...member,
        createdAt: member.createdAt.toISOString(),
        updatedAt: member.updatedAt.toISOString(),
      },
    },
    { status: 201 }
  )
}

export const GET = withErrorHandling(getHandler)
export const POST = withErrorHandling(postHandler)
