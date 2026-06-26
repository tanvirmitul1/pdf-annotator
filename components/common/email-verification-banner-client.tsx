"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle, Clock, Loader2, MailWarning, X } from "lucide-react"

type Status = "idle" | "sending" | "sent" | "cooldown"

type ApiResponse = {
  data?: { alreadyVerified?: boolean; sent?: boolean }
  error?: { code: string; details?: { retryAfter?: number } }
}

export function EmailVerificationBannerClient({ email }: { email: string }) {
  const [dismissed, setDismissed] = useState(false)
  const [status, setStatus] = useState<Status>("idle")
  const [countdown, setCountdown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startCountdown(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCountdown(seconds)
    setStatus("cooldown")
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          setStatus("idle")
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function resend() {
    if (status !== "idle") return
    setStatus("sending")
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" })
      const json = (await res.json()) as ApiResponse

      if (res.status === 429) {
        startCountdown(json.error?.details?.retryAfter ?? 60)
        return
      }
      setStatus("sent")
    } catch {
      setStatus("idle")
    }
  }

  if (dismissed) return null

  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/20 bg-amber-500/8 px-4 py-2.5 text-sm dark:bg-amber-500/10">
      <div className="flex items-center gap-2.5 text-amber-700 dark:text-amber-400">
        <MailWarning className="size-4 shrink-0" />
        <span>
          Please verify your email address{" "}
          <strong className="font-medium">{email}</strong>.
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {status === "sent" ? (
          <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
            <CheckCircle className="size-3.5" />
            Email sent
          </span>
        ) : status === "cooldown" ? (
          <span className="flex items-center gap-1.5 text-xs text-amber-600/80 dark:text-amber-400/80">
            <Clock className="size-3.5" />
            Resend in {countdown}s
          </span>
        ) : (
          <button
            type="button"
            disabled={status === "sending"}
            onClick={() => void resend()}
            className="flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
          >
            {status === "sending" && <Loader2 className="size-3 animate-spin" />}
            Resend email
          </button>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="rounded p-0.5 text-amber-600/60 transition-colors hover:text-amber-700 dark:text-amber-500/60 dark:hover:text-amber-400"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
