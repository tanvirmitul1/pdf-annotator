import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const document = await prisma.document.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      userId: true,
      pageCount: true,
      fileSize: true,
      status: true,
      storageKey: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      _count: {
        select: {
          annotations: { where: { deletedAt: null } },
        },
      },
    },
  })

  if (!document) {
    throw new NotFoundError("Document")
  }

  return NextResponse.json(document)
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params

  const document = await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, name: true, userId: true },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.document.delete",
    resourceType: "Document",
    resourceId: id,
    metadata: { name: document.name, ownerId: document.userId },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler)
export const DELETE = withErrorHandling(deleteHandler)
