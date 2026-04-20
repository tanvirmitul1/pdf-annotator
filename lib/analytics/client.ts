import posthog from "posthog-js"

let initialized = false

export function initPostHogClient() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (initialized || !key || !host || typeof window === "undefined") {
    return
  }

  posthog.init(key, {
    api_host: host,
    person_profiles: "identified_only",
    capture_pageview: false,
  })

  initialized = true
}
