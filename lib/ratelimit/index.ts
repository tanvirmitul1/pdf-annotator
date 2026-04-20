import { RateLimitedError } from "@/lib/errors"

type BucketName = "auth" | "settings" | "default"

const LIMITS: Record<BucketName, { max: number; windowMs: number }> = {
  auth: { max: 20, windowMs: 60_000 },
  settings: { max: 60, windowMs: 60_000 },
  default: { max: 120, windowMs: 60_000 },
}

const requestBuckets = new Map<string, number[]>()

export async function enforceRateLimit(
  key: string,
  bucket: BucketName = "default"
) {
  const now = Date.now()
  const config = LIMITS[bucket]
  const entryKey = `${bucket}:${key}`
  const requests = requestBuckets.get(entryKey) ?? []
  const activeRequests = requests.filter((timestamp) => now - timestamp < config.windowMs)

  if (activeRequests.length >= config.max) {
    throw new RateLimitedError(Math.ceil(config.windowMs / 1000))
  }

  activeRequests.push(now)
  requestBuckets.set(entryKey, activeRequests)
}

