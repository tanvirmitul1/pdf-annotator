import { NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

async function handler() {
  await requireAdmin()

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalDocuments,
    totalAnnotations,
    activeUsers,
    usersByPlan,
    storageUsage,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: monthAgo }, deletedAt: null } }),
    prisma.document.count({ where: { deletedAt: null } }),
    prisma.annotation.count({ where: { deletedAt: null } }),
    prisma.user.count({
      where: {
        sessions: { some: { expires: { gte: weekAgo } } },
        deletedAt: null,
      },
    }),
    prisma.user.groupBy({
      by: ["planId"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.usage.aggregate({
      where: { metric: "STORAGE_MB" },
      _sum: { value: true },
    }),
  ])

  return NextResponse.json({
    totalUsers,
    newUsersThisWeek,
    newUsersThisMonth,
    totalDocuments,
    totalAnnotations,
    activeUsers,
    usersByPlan: usersByPlan.map((p) => ({ planId: p.planId, count: p._count })),
    totalStorageMB: storageUsage._sum.value ?? 0,
  })
}

export const GET = withErrorHandling(handler)
