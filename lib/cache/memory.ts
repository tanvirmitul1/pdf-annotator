type CacheEntry = {
  expiresAt: number
  value: string
}

const store = new Map<string, CacheEntry>()

export async function getCachedValue(key: string) {
  const hit = store.get(key)

  if (!hit) {
    return null
  }

  if (Date.now() > hit.expiresAt) {
    store.delete(key)
    return null
  }

  return hit.value
}

export async function setCachedValue(key: string, value: string, ttlSeconds: number) {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function deleteCachedValue(key: string) {
  store.delete(key)
}

export async function clearMemoryCache() {
  store.clear()
}
