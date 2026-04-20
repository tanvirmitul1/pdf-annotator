import { Ratelimit } from "@upstash/ratelimit"
import type { NextRequest } from "next/server"

import { upstashClient } from "@/lib/cache/redis"
import { env } from "@/lib/env"
import { RateLimitedError } from "@/lib/errors"

type BucketName = "auth" | "upload" | "annotation-write" | "default"

type MemoryWindow = {
  timestamps: number[]
}

const memoryBuckets = new Map<string, MemoryWindow>()

const BUCKETS: Record<BucketName, { requests: number; window: `${number} ${"s" | "m" | "h"}`; seconds: number }> = {
  auth: { requests: 10, window: "1 m", seconds: 60 },
  upload: { requests: 20, window: "1 h", seconds: 3600 },
  "annotation-write": { requests: 300, window: "1 m", seconds: 60 },
  default: { requests: 120, window: "1 m", seconds: 60 },
}

const upstashEnabled = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN && upstashClient)

function createLimiter(bucket: BucketName) {
  if (!upstashEnabled) {
    return null
  }

  return new Ratelimit({
    redis: upstashClient!,
    limiter: Ratelimit.slidingWindow(BUCKETS[bucket].requests, BUCKETS[bucket].window),
    analytics: false,
    prefix: `ratelimit:${bucket}`,
  })
}

export async function enforceRateLimit(
  req: NextRequest | Request,
  identifier: string,
  bucket: BucketName = "default"
) {
  const key = `${bucket}:${identifier}`
  const limiter = createLimiter(bucket)

  if (limiter) {
    const result = await limiter.limit(identifier)
    if (!result.success) {
      throw new RateLimitedError(result.reset ? Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)) : 60)
    }
    return
  }

  const now = Date.now()
  const config = BUCKETS[bucket]
  const current = memoryBuckets.get(key) ?? { timestamps: [] }
  current.timestamps = current.timestamps.filter((timestamp) => now - timestamp < config.seconds * 1000)

  if (current.timestamps.length >= config.requests) {
    throw new RateLimitedError(config.seconds)
  }

  current.timestamps.push(now)
  memoryBuckets.set(key, current)
  void req
}

export function resetRateLimits() {
  memoryBuckets.clear()
}
