"use client"

import { type FormEvent, useState } from "react"
import { Mail, Loader2, CheckCircle } from "lucide-react"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setStatus("submitting")
    setErrorMsg("")

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      // Always show success regardless of whether the email exists
      setStatus("sent")
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center gap-5 px-8 py-10">
        <CheckCircle className="size-12 text-green-500" />
        <div className="space-y-1 text-center">
          <p className="text-sm font-medium text-foreground">Check your email</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, you&apos;ll receive a reset link shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email address"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-pill-input pl-10 pr-4"
          />
        </div>

        {status === "error" && (
          <p className="text-xs text-destructive">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting" || !email}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
          Send reset link
        </button>
      </form>
    </div>
  )
}
