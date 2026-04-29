import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

const ListErrorsSchema = z.object({
  search: z.string().optional(),
  errorType: z.string().optional(),
  userId: z.string().optional(),
  resolved: z.enum(["true", "false"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = ListErrorsSchema.parse({
    search: searchParams.get("search") || undefined,
    errorType: searchParams.get("errorType") || undefined,
    userId: searchParams.get("userId") || undefined,
    resolved: searchParams.get("resolved") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  })

  const where: Prisma.ErrorLogWhereInput = {}

  if (params.search) {
    where.OR = [
      { message: { contains: params.search, mode: "insensitive" } },
      { errorCode: { contains: params.search, mode: "insensitive" } },
      { url: { contains: params.search, mode: "insensitive" } },
    ]
  }

  if (params.errorType) {
    where.errorType = params.errorType as Prisma.EnumErrorTypeFilter
  }

  if (params.userId) {
    where.userId = params.userId
  }

  if (params.resolved) {
    where.resolved = params.resolved === "true"
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) {
      where.createdAt.gte = new Date(params.startDate)
    }
    if (params.endDate) {
      where.createdAt.lte = new Date(params.endDate)
    }
  }

  const [errors, totalCount] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      select: {
        id: true,
        userId: true,
        userEmail: true,
        userName: true,
        errorType: true,
        errorCode: true,
        message: true,
        url: true,
        method: true,
        statusCode: true,
        ipAddress: true,
        resolved: true,
        resolvedBy: true,
        resolvedAt: true,
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
    prisma.errorLog.count({ where }),
  ])

  return NextResponse.json({
    items: errors,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    },
  })
}

export const GET = withErrorHandling(handler)
