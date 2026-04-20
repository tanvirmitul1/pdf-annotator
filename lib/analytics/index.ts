import { PostHog } from "posthog-node"

import { env } from "@/lib/env"
import { type AnalyticsEvent } from "@/lib/analytics/events"

const posthog =
  env.POSTHOG_KEY && env.POSTHOG_HOST
    ? new PostHog(env.POSTHOG_KEY, {
        host: env.POSTHOG_HOST,
        flushAt: 1,
      })
    : null

export async function track<E extends AnalyticsEvent["name"]>(
  userId: string,
  name: E,
  props: Extract<AnalyticsEvent, { name: E }>["props"]
) {
  if (!posthog || env.APP_ENV === "development") {
    return
  }

  await posthog.capture({
    distinctId: userId,
    event: name,
    properties: props,
  })
}
