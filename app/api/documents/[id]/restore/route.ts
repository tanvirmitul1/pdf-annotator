import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { incrementUsage } from "@/lib/authz/plan"
import { logAudit } from "@/lib/audit"

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      deletedAt: { not: null },
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  // Check if within 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  if (document.deletedAt! < thirtyDaysAgo) {
    return NextResponse.json({ error: "Document can no longer be restored" }, { status: 410 })
  }

  // Restore
  await prisma.document.update({
    where: { id },
    data: { deletedAt: null },
  })

  // Re-increment usage
  await incrementUsage(user.id, "DOCUMENTS", 1)
  await incrementUsage(user.id, "STORAGE_MB", Math.ceil(document.fileSize / (1024 * 1024)))

  await logAudit({
    userId: user.id,
    action: "document.restore",
    resourceType: "document",
    resourceId: id,
    metadata: {},
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(handler)