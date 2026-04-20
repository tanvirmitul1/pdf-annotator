import { type AnalyticsConsent } from "@/lib/analytics/events"

export function shouldLoadAnalytics(consent: AnalyticsConsent) {
  return consent === "accepted"
}
