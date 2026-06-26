"use client"

import { useEffect, useRef, useState } from "react"
import { CheckCircle, Clock, Loader2, Mail } from "lucide-react"

type Status = "idle" | "sending" | "sent" | "error" | "cooldown"

type ApiResponse = {
  data?: { alreadyVerified?: boolean; sent?: boolean }
  error?: { code: string; message?: string; details?: { retryAfter?: number } }
}

export function VerifyEmailPrompt() {
  const [status, setStatus] = useState<Status>("idle")
  const [countdown, setCountdown] = useState(0)
  const [totalCooldown, setTotalCooldown] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startCountdown(seconds: number) {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setTotalCooldown(seconds)
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
    if (status === "sending" || status === "cooldown") return
    setStatus("sending")
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST" })
      const json = (await res.json()) as ApiResponse

      if (res.status === 429) {
        const retryAfter = json.error?.details?.retryAfter ?? 60
        startCountdown(retryAfter)
        return
      }
      if (json.data?.alreadyVerified || json.data?.sent) {
        setStatus("sent")
        return
      }
      setStatus("error")
    } catch {
      setStatus("error")
    }
  }

  const ringRadius = 26
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringProgress = totalCooldown > 0 ? countdown / totalCooldown : 0

  return (
    <div className="flex flex-col items-center gap-5 px-8 py-10">
      {/* Icon */}
      <div
        className={`flex size-14 items-center justify-center rounded-2xl border bg-muted/40 transition-all duration-300 ${
          status === "cooldown"
            ? "border-amber-500/40 bg-amber-500/5"
            : "border-border/50"
        }`}
      >
        {status === "cooldown" ? (
          <Clock className="size-7 text-amber-500" />
        ) : (
          <Mail className="size-7 text-muted-foreground" />
        )}
      </div>

      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        Didn&apos;t receive the email? Check your spam folder or resend below.
      </p>

      {status === "sent" ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="size-4" />
          Email sent — check your inbox.
        </div>
      ) : status === "cooldown" ? (
        <div className="flex flex-col items-center gap-4">
          {/* Animated countdown ring */}
          <div className="relative flex size-20 items-center justify-center" aria-label={`Wait ${countdown} seconds`}>
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 64 64"
              aria-hidden="true"
            >
              {/* Track */}
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                className="fill-none stroke-border/50"
                strokeWidth="3"
              />
              {/* Progress */}
              <circle
                cx="32"
                cy="32"
                r={ringRadius}
                className="fill-none stroke-amber-500 transition-all duration-1000 ease-linear"
                strokeWidth="3"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringCircumference * (1 - ringProgress)}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-xl font-semibold tabular-nums text-foreground">
              {countdown}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Wait{" "}
            <span className="font-medium text-amber-600 dark:text-amber-400">
              {countdown}s
            </span>{" "}
            before requesting another email
          </p>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex h-10 cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-border/30 bg-card/30 px-5 text-sm font-medium text-muted-foreground/40 backdrop-blur-sm"
          >
            Resend verification email
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={status === "sending"}
          onClick={() => void resend()}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/60 bg-card/60 px-5 text-sm font-medium backdrop-blur-sm transition-all hover:border-border hover:bg-card disabled:opacity-50"
        >
          {status === "sending" && <Loader2 className="size-4 animate-spin" />}
          {status === "error" ? "Failed — try again" : "Resend verification email"}
        </button>
      )}
    </div>
  )
}
