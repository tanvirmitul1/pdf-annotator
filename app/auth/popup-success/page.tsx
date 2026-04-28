"use client"

import { useEffect } from "react"

// This page is only ever loaded inside the Google OAuth popup.
// It signals the opener tab that auth completed, then closes itself.
export default function PopupSuccessPage() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "GOOGLE_AUTH_SUCCESS" },
        window.location.origin,
      )
      window.close()
    } else {
      // Fallback: opened as a full page (e.g. direct navigation), redirect normally
      window.location.href = "/app"
    }
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  )
}
