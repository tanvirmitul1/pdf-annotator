"use client"

import * as React from "react"

import { ANALYTICS_CONSENT_COOKIE, type AnalyticsConsent } from "@/lib/analytics/events"
import { Button } from "@/components/ui/button"

interface CookieBannerProps {
  initialConsent: AnalyticsConsent
}

export function CookieBanner({ initialConsent }: CookieBannerProps) {
  const [consent, setConsent] = React.useState<AnalyticsConsent>(initialConsent)

  if (consent !== "unknown") {
    return null
  }

  function setCookieConsent(nextConsent: Exclude<AnalyticsConsent, "unknown">) {
    document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${nextConsent}; Path=/; Max-Age=31536000; SameSite=Lax`
    setConsent(nextConsent)
    window.dispatchEvent(new CustomEvent("analytics-consent-updated", { detail: nextConsent }))
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-3xl border border-border bg-card/95 p-4 shadow-2xl backdrop-blur md:inset-x-auto md:right-6 md:w-[28rem]">
      <p className="text-sm font-semibold text-foreground">Cookie preferences</p>
      <p className="mt-2 text-sm text-muted-foreground">
        We use essential cookies to keep sign-in and settings working. Analytics stays off until you
        accept it.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="hover:bg-primary/90"
          onClick={() => setCookieConsent("accepted")}
        >
          Accept analytics
        </Button>
        <Button
          type="button"
          variant="outline"
          className="hover:bg-accent"
          onClick={() => setCookieConsent("rejected")}
        >
          Reject essential only
        </Button>
      </div>
    </div>
  )
}
