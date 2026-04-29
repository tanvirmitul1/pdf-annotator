"use client"

import { useEffect } from "react"

// This page is loaded inside OAuth popups (Google, GitHub, etc.).
// It signals the opener tab that auth completed, then closes itself.
export default function PopupSuccessPage() {
  useEffect(() => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "OAUTH_SUCCESS" },
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
