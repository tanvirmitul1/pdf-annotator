"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react"

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg("Passwords do not match.")
      return
    }
    setStatus("submitting")
    setErrorMsg("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const json = (await res.json()) as { data?: { reset?: boolean }; error?: { message?: string } }

      if (json.data?.reset) {
        setStatus("done")
        setTimeout(() => router.push("/auth/login"), 2000)
      } else {
        setErrorMsg(json.error?.message ?? "Something went wrong.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-4 px-8 py-10">
        <CheckCircle className="size-12 text-green-500" />
        <p className="text-center text-sm text-muted-foreground">
          Password updated! Redirecting to login…
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 py-8">
      <form onSubmit={(e) => void onSubmit(e)} className="flex flex-col gap-4">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            placeholder="New password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-pill-input pl-10 pr-12"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        <div className="relative">
          <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type={show ? "text" : "password"}
            placeholder="Confirm new password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="auth-pill-input pl-10 pr-4"
          />
        </div>

        {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}

        <button
          type="submit"
          disabled={status === "submitting" || !password || !confirm}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-foreground text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {status === "submitting" && <Loader2 className="size-4 animate-spin" />}
          Set new password
        </button>
      </form>
    </div>
  )
}
