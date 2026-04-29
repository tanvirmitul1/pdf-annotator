import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"

type RouteContext = { params: Promise<{ id: string }> }

/** Revoke (soft-delete) an API key. */
async function deleteHandler(request: NextRequest, ctx: RouteContext) {
  const user = await requireUser()
  const { id } = await ctx.params

  const key = await prisma.apiKey.findUnique({
    where: { id },
    select: { id: true, userId: true, name: true, prefix: true, revokedAt: true },
  })

  // Return 404 for missing keys or keys owned by another user (prevent enumeration)
  if (!key || key.userId !== user.id) {
    throw new NotFoundError("API key not found")
  }

  if (!key.revokedAt) {
    await prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  await logAudit({
    userId: user.id,
    action: "api_key.revoke",
    resourceType: "ApiKey",
    resourceId: id,
    metadata: { name: key.name, prefix: key.prefix },
    ipAddress: "unknown",
  })

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler)
