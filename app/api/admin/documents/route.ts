import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

const ListDocumentsSchema = z.object({
  search: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(["PROCESSING", "READY", "FAILED"]).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = ListDocumentsSchema.parse({
    search: searchParams.get("search") || undefined,
    userId: searchParams.get("userId") || undefined,
    status: searchParams.get("status") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  })

  const where: Prisma.DocumentWhereInput = { deletedAt: null }

  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" }
  }

  if (params.userId) {
    where.userId = params.userId
  }

  if (params.status) {
    where.status = params.status
  }

  const [documents, totalCount] = await Promise.all([
    prisma.document.findMany({
      where,
      select: {
        id: true,
        name: true,
        userId: true,
        pageCount: true,
        fileSize: true,
        status: true,
        createdAt: true,
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
    prisma.document.count({ where }),
  ])

  return NextResponse.json({
    items: documents,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    },
  })
}

export const GET = withErrorHandling(handler)
