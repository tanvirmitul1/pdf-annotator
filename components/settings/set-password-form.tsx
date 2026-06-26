"use client"

import { type FormEvent, useState } from "react"
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"

export function SetPasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      setErrorMsg("Passwords do not match.")
      return
    }
    setStatus("submitting")
    setErrorMsg("")

    try {
      const body: Record<string, string> = { newPassword: next }
      if (hasPassword) body.currentPassword = current

      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { data?: { updated?: boolean }; error?: { message?: string } }

      if (json.data?.updated) {
        setStatus("done")
        setCurrent("")
        setNext("")
        setConfirm("")
      } else {
        setErrorMsg(json.error?.message ?? "Something went wrong.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  const inputClass =
    "w-full rounded-lg border border-border/60 bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40"

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {hasPassword && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Current password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={`${inputClass} pl-9`}
              placeholder="Current password"
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          {hasPassword ? "New password" : "Set a password"}
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className={`${inputClass} pl-9 pr-10`}
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Confirm password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={`${inputClass} pl-9`}
            placeholder="Repeat new password"
          />
        </div>
      </div>

      {errorMsg && <p className="text-sm text-destructive">{errorMsg}</p>}

      {status === "done" && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="size-4" />
          Password {hasPassword ? "updated" : "set"} successfully.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
        {hasPassword ? "Update password" : "Set password"}
      </button>
    </form>
  )
}
