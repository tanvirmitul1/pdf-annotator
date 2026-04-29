import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"

const CreatePlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price: z.number().min(0).default(0),
  limits: z.any(),
})

async function getHandler() {
  await requireAdmin()

  const plans = await prisma.plan.findMany({
    select: {
      id: true,
      name: true,
      price: true,
      limits: true,
      createdAt: true,
      _count: {
        select: {
          users: { where: { deletedAt: null } },
        },
      },
    },
    orderBy: { price: "asc" },
  })

  return NextResponse.json(plans)
}

async function postHandler(request: NextRequest) {
  const admin = await requireAdmin()
  const body = await request.json()
  const data = CreatePlanSchema.parse(body)

  const plan = await prisma.plan.create({
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
    action: "admin.plan.create",
    resourceType: "Plan",
    resourceId: plan.id,
    metadata: { name: data.name },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json(plan, { status: 201 })
}

export const GET = withErrorHandling(getHandler)
export const POST = withErrorHandling(postHandler)
