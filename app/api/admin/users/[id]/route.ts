import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"

const UpdateUserSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  planId: z.string().optional(),
  subscriptionStatus: z.enum(["FREE", "TRIALING", "ACTIVE", "PAST_DUE", "CANCELED"]).optional(),
})

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      planId: true,
      subscriptionStatus: true,
      isAnonymous: true,
      createdAt: true,
      updatedAt: true,
      lastKnownIp: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      _count: {
        select: {
          documents: { where: { deletedAt: null } },
          annotations: { where: { deletedAt: null } },
          apiKeys: true,
        },
      },
      usage: true,
    },
  })

  if (!user) {
    throw new NotFoundError("User")
  }

  return NextResponse.json(user)
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const body = await request.json()
  const data = UpdateUserSchema.parse(body)

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      planId: true,
      subscriptionStatus: true,
    },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.user.update",
    resourceType: "User",
    resourceId: id,
    metadata: { changes: data },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json(user)
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params

  const user = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true, email: true },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.user.delete",
    resourceType: "User",
    resourceId: id,
    metadata: { email: user.email },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler)
export const PATCH = withErrorHandling(patchHandler)
export const DELETE = withErrorHandling(deleteHandler)
