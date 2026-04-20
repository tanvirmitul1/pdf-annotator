import posthog from "posthog-js"

import { env } from "@/lib/env"

let initialized = false

export function initPostHogClient() {
  if (initialized || !env.POSTHOG_KEY || !env.POSTHOG_HOST || typeof window === "undefined") {
    return
  }

  posthog.init(env.POSTHOG_KEY, {
    api_host: env.POSTHOG_HOST,
    person_profiles: "identified_only",
    capture_pageview: false,
  })

  initialized = true
}
