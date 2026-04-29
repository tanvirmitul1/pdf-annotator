import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"

const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  price: z.number().min(0).optional(),
  limits: z.any().optional(),
})

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const plan = await prisma.plan.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      price: true,
      limits: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: { where: { deletedAt: null } },
        },
      },
    },
  })

  if (!plan) {
    throw new NotFoundError("Plan")
  }

  return NextResponse.json(plan)
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const body = await request.json()
  const data = UpdatePlanSchema.parse(body)

  const plan = await prisma.plan.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      price: true,
      limits: true,
    },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.plan.update",
    resourceType: "Plan",
    resourceId: id,
    metadata: { changes: data },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json(plan)
}

async function deleteHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params

  const plan = await prisma.plan.delete({
    where: { id },
    select: { id: true, name: true },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.plan.delete",
    resourceType: "Plan",
    resourceId: id,
    metadata: { name: plan.name },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler)
export const PATCH = withErrorHandling(patchHandler)
export const DELETE = withErrorHandling(deleteHandler)
