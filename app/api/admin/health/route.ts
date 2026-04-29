import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"

async function handler(_request: NextRequest) {
  await requireAdmin()

  const checks = {
    database: false,
    redis: false,
    storage: true,
  }

  try {
    await prisma.$queryRaw`SELECT 1`
    checks.database = true
  } catch {}

  return NextResponse.json({
    status: checks.database ? "healthy" : "degraded",
    checks,
    uptime: process.uptime(),
    nodeVersion: process.version,
    env: process.env.NODE_ENV,
  })
}

export const GET = withErrorHandling(handler)
