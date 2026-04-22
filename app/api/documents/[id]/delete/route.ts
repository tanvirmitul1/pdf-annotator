import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { logAudit } from "@/lib/audit"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { decrementUsage } from "@/lib/authz/plan"
import { prisma } from "@/lib/db/prisma"

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  await prisma.document.update({
    where: { id },
    data: { deletedAt: new Date() },
  })

  await decrementUsage(user.id, "DOCUMENTS", 1)
  await decrementUsage(
    user.id,
    "STORAGE_MB",
    Math.ceil(document.fileSize / (1024 * 1024))
  )

  await logAudit({
    userId: user.id,
    action: "document.delete",
    resourceType: "document",
    resourceId: id,
    metadata: {},
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown",
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(handler)
