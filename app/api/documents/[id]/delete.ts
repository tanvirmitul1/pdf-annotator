import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { decrementUsage } from "@/lib/authz/plan"
import { logAudit } from "@/lib/audit"

async function handler(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: {
      id: params.id,
      userId: user.id,
      deletedAt: null,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Soft delete
  await prisma.document.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  })

  // Decrement usage
  await decrementUsage(user.id, "DOCUMENTS", 1)
  await decrementUsage(user.id, "STORAGE_MB", Math.ceil(document.fileSize / (1024 * 1024)))

  await logAudit({
    userId: user.id,
    action: "document.delete",
    resourceType: "document",
    resourceId: params.id,
    metadata: {},
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(handler)