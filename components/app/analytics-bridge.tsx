"use client"

import * as React from "react"

import { shouldLoadAnalytics } from "@/lib/analytics/consent"
import { type AnalyticsConsent } from "@/lib/analytics/events"

interface AnalyticsBridgeProps {
  consent: AnalyticsConsent
}

export function AnalyticsBridge({ consent }: AnalyticsBridgeProps) {
  const [currentConsent, setCurrentConsent] = React.useState(consent)

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<AnalyticsConsent>).detail
      setCurrentConsent(detail)
    }

    window.addEventListener("analytics-consent-updated", handler)
    return () => window.removeEventListener("analytics-consent-updated", handler)
  }, [])

  if (!shouldLoadAnalytics(currentConsent)) {
    return <div hidden data-testid="analytics-disabled" data-consent={currentConsent} />
  }

  return (
    <>
      <div hidden data-testid="analytics-enabled" data-consent={currentConsent} />
      <script
        id="posthog-placeholder"
        dangerouslySetInnerHTML={{
          __html: "window.__PDF_ANNOTATOR_ANALYTICS__ = 'enabled';",
        }}
      />
    </>
  )
}
