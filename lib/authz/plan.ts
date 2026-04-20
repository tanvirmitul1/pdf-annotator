import { UsageMetric } from "@prisma/client"
import { z } from "zod"

import { cacheDelete, cacheGet, cacheSet } from "@/lib/cache/redis"
import { prisma } from "@/lib/db/prisma"
import { NotFoundError } from "@/lib/errors"

const CACHE_TTL_SECONDS = 60

const PlanLimitsSchema = z.object({
  maxDocuments: z.number().int().nonnegative(),
  maxStorageMB: z.number().int().nonnegative(),
  maxAnnotationsPerDoc: z.number().int().nonnegative(),
  maxShareLinks: z.number().int().nonnegative(),
  allowedFeatures: z.array(z.string()),
})

export type PlanLimits = z.infer<typeof PlanLimitsSchema>

export async function getPlan(userId: string) {
  const cacheKey = `plan:${userId}`
  const cached = await cacheGet(cacheKey)

  if (cached) {
    return PlanLimitsSchema.parse(JSON.parse(cached))
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: {
        select: {
          limits: true,
        },
      },
    },
  })

  if (!user?.plan) {
    throw new NotFoundError("Plan")
  }

  const parsed = PlanLimitsSchema.parse(user.plan.limits)
  await cacheSet(cacheKey, JSON.stringify(parsed), CACHE_TTL_SECONDS)
  return parsed
}

export async function getUsage(userId: string, metric: UsageMetric) {
  const cacheKey = `usage:${userId}:${metric}`
  const cached = await cacheGet(cacheKey)

  if (cached) {
    return Number(cached)
  }

  const usage = await prisma.usage.findUnique({
    where: {
      userId_metric: {
        userId,
        metric,
      },
    },
    select: {
      value: true,
    },
  })

  const value = usage?.value ?? 0
  await cacheSet(cacheKey, String(value), CACHE_TTL_SECONDS)
  return value
}

export async function incrementUsage(userId: string, metric: UsageMetric, delta: number) {
  const usage = await prisma.usage.upsert({
    where: {
      userId_metric: {
        userId,
        metric,
      },
    },
    create: {
      userId,
      metric,
      value: Math.max(delta, 0),
    },
    update: {
      value: {
        increment: delta,
      },
    },
  })

  await cacheDelete(`usage:${userId}:${metric}`)
  return usage
}

export async function decrementUsage(userId: string, metric: UsageMetric, delta: number) {
  const usage = await prisma.usage.upsert({
    where: {
      userId_metric: {
        userId,
        metric,
      },
    },
    create: {
      userId,
      metric,
      value: 0,
    },
    update: {
      value: {
        decrement: delta,
      },
    },
  })

  await cacheDelete(`usage:${userId}:${metric}`)
  return usage
}
