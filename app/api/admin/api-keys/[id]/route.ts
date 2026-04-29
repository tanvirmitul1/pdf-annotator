import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params

  const apiKey = await prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
    select: {
      id: true,
      name: true,
      userId: true,
    },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.api_key.revoke",
    resourceType: "ApiKey",
    resourceId: id,
    metadata: { targetUserId: apiKey.userId },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(handler)
