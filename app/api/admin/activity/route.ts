import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

const ListActivitySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  resourceType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = ListActivitySchema.parse({
    userId: searchParams.get("userId") || undefined,
    action: searchParams.get("action") || undefined,
    resourceType: searchParams.get("resourceType") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 50,
  })

  const where: Prisma.AuditLogWhereInput = {}

  if (params.userId) {
    where.userId = params.userId
  }

  if (params.action) {
    where.action = { contains: params.action, mode: "insensitive" }
  }

  if (params.resourceType) {
    where.resourceType = params.resourceType
  }

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({
    items: logs,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    },
  })
}

export const GET = withErrorHandling(handler)
