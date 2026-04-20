import { Redis } from "@upstash/redis"

import { env } from "@/lib/env"
import { clearMemoryCache, deleteCachedValue, getCachedValue, setCachedValue } from "@/lib/cache/memory"

const upstashClient =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

export { upstashClient }

export async function cacheGet(key: string) {
  if (upstashClient) {
    const value = await upstashClient.get<string>(key)
    return value ?? null
  }

  return getCachedValue(key)
}

export async function cacheSet(key: string, value: string, ttlSeconds: number) {
  if (upstashClient) {
    await upstashClient.set(key, value, { ex: ttlSeconds })
    return
  }

  await setCachedValue(key, value, ttlSeconds)
}

export async function cacheDelete(key: string) {
  if (upstashClient) {
    await upstashClient.del(key)
    return
  }

  await deleteCachedValue(key)
}

export async function resetCaches() {
  if (!upstashClient) {
    await clearMemoryCache()
  }
}
