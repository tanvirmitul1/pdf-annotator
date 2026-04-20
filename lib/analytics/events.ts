export type AnalyticsEvent =
  | { name: "user_signed_up"; props: { method: "google" | "credentials" } }
  | { name: "user_signed_in"; props: { method: "google" | "credentials" } }
  | { name: "user_signed_out"; props: Record<string, never> }
  | { name: "profile_updated"; props: Record<string, never> }
  | { name: "data_export_requested"; props: Record<string, never> }

export const ANALYTICS_CONSENT_COOKIE = "pdf-annotator-analytics"

export type AnalyticsConsent = "accepted" | "rejected" | "unknown"
