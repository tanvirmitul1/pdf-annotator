"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

interface GraceBannerProps {
  daysRemaining: number
}

export function GraceBanner({ daysRemaining }: GraceBannerProps) {
  const router = useRouter()
  const [message, setMessage] = React.useState("")
  const [pending, setPending] = React.useState(false)

  async function restoreAccount() {
    setPending(true)
    setMessage("")

    const response = await fetch("/api/settings/restore-account", {
      method: "POST",
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setMessage(payload.error?.message ?? "Restore failed")
      setPending(false)
      return
    }

    setMessage("Your account has been restored.")
    setPending(false)
    router.refresh()
  }

  return (
    <div className="rounded-3xl border border-amber-400/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-300/20 dark:bg-amber-500/10 dark:text-amber-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Your account is scheduled for deletion.</p>
          <p className="mt-1 text-sm/6 opacity-90">
            You can still sign in during your 7-day grace period. Restore it within{" "}
            {daysRemaining} day{daysRemaining === 1 ? "" : "s"} to keep everything intact.
          </p>
          <p className="sr-only" role="status" aria-live="polite">
            {message}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-amber-500/40 bg-transparent hover:bg-amber-500/10"
          onClick={() => void restoreAccount()}
          disabled={pending}
        >
          {pending ? "Restoring..." : "Restore account"}
        </Button>
      </div>
    </div>
  )
}
