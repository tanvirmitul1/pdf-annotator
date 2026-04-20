import { cookies } from "next/headers"

import { ANALYTICS_CONSENT_COOKIE, type AnalyticsConsent } from "@/lib/analytics/events"

export async function getAnalyticsConsent(): Promise<AnalyticsConsent> {
  const cookieStore = await cookies()
  const value = cookieStore.get(ANALYTICS_CONSENT_COOKIE)?.value

  if (value === "accepted" || value === "rejected") {
    return value
  }

  return "unknown"
}
