import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"

const ListUsersSchema = z.object({
  search: z.string().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  planId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const params = ListUsersSchema.parse({
    search: searchParams.get("search") || undefined,
    role: searchParams.get("role") || undefined,
    planId: searchParams.get("planId") || undefined,
    page: searchParams.get("page") || 1,
    limit: searchParams.get("limit") || 20,
  })

  const where: Prisma.UserWhereInput = { deletedAt: null }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      { email: { contains: params.search, mode: "insensitive" } },
    ]
  }

  if (params.role) {
    where.role = params.role
  }

  if (params.planId) {
    where.planId = params.planId
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
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
        lastKnownIp: true,
        _count: {
          select: {
            documents: { where: { deletedAt: null } },
            annotations: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
    }),
    prisma.user.count({ where }),
  ])

  return NextResponse.json({
    items: users,
    pagination: {
      page: params.page,
      limit: params.limit,
      totalItems: totalCount,
      totalPages: Math.ceil(totalCount / params.limit),
    },
  })
}

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
  planId: z.string().optional(),
})

async function postHandler(request: NextRequest) {
  const admin = await requireAdmin()
  const body = await request.json()
  const data = CreateUserSchema.parse(body)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      planId: data.planId || "free",
      subscriptionStatus: "FREE",
      isAnonymous: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      planId: true,
      subscriptionStatus: true,
      createdAt: true,
    },
  })

  await logAudit({
    userId: admin.id,
    action: "admin.user.create",
    resourceType: "User",
    resourceId: user.id,
    metadata: { email: data.email, role: data.role },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json(user, { status: 201 })
}

export const GET = withErrorHandling(handler)
export const POST = withErrorHandling(postHandler)
