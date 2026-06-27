import { env } from "@/lib/env"

export async function track(
  userId: string,
  event: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  if (!env.POSTHOG_KEY) return

  try {
    await fetch(`${env.POSTHOG_HOST ?? "https://app.posthog.com"}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: env.POSTHOG_KEY,
        event,
        distinct_id: userId,
        properties: { ...properties, $lib: "server" },
        timestamp: new Date().toISOString(),
      }),
    })
  } catch {
    // Analytics is non-critical; swallow errors silently
  }
}
