import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

const StatsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = StatsSchema.parse({
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  })

  const dateFilter = params.startDate || params.endDate
    ? {
        createdAt: {
          ...(params.startDate && { gte: new Date(params.startDate) }),
          ...(params.endDate && { lte: new Date(params.endDate) }),
        },
      }
    : {}

  const [total, unresolved, byType, recentErrors] = await Promise.all([
    prisma.errorLog.count({ where: dateFilter }),
    prisma.errorLog.count({ where: { ...dateFilter, resolved: false } }),
    prisma.errorLog.groupBy({
      by: ["errorType"],
      where: dateFilter,
      _count: true,
      orderBy: { _count: { errorType: "desc" } },
    }),
    prisma.errorLog.findMany({
      where: dateFilter,
      select: {
        id: true,
        errorType: true,
        message: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayCount = await prisma.errorLog.count({
    where: {
      ...dateFilter,
      createdAt: { gte: today },
    },
  })

  return NextResponse.json({
    total,
    unresolved,
    resolved: total - unresolved,
    todayCount,
    byType: byType.map((item) => ({
      type: item.errorType,
      count: item._count,
    })),
    recentErrors,
  })
}

export const GET = withErrorHandling(handler)
