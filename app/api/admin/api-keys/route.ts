import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

const ListApiKeysSchema = z.object({
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = ListApiKeysSchema.parse({
    userId: searchParams.get("userId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  })

  const where: Prisma.ApiKeyWhereInput = {}

  if (params.userId) {
    where.userId = params.userId
  }

  const [apiKeys, totalCount] = await Promise.all([
    prisma.apiKey.findMany({
      where,
      select: {
        id: true,
        name: true,
        prefix: true,
        userId: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
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
    prisma.apiKey.count({ where }),
  ])

  return NextResponse.json({
    items: apiKeys,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    },
  })
}

export const GET = withErrorHandling(handler)
