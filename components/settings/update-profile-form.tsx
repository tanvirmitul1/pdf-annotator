"use client"

import { type FormEvent, useState } from "react"
import {
  User,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpdateProfileFormProps {
  name: string | null
  email: string | null
  emailVerified: boolean
  initials: string
  hasPassword: boolean
}

// ── Profile section ───────────────────────────────────────────────────────────

function ProfileSection({
  name,
  email,
  emailVerified,
  initials,
}: Omit<UpdateProfileFormProps, "hasPassword">) {
  const [nameVal, setNameVal] = useState(name ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const dirty = nameVal.trim() !== (name ?? "").trim()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!dirty) return
    setStatus("saving")
    setErrorMsg("")
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameVal.trim() }),
      })
      const json = (await res.json()) as {
        data?: { updated?: boolean }
        error?: { message?: string }
      }
      if (json.data?.updated) {
        setStatus("saved")
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setErrorMsg(json.error?.message ?? "Something went wrong.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white text-xl font-bold select-none shadow-lg shadow-indigo-500/20">
          {initials}
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Profile picture</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auto-generated from your initials
          </p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="display-name">
          Display name
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="display-name"
            type="text"
            value={nameVal}
            onChange={(e) => {
              setNameVal(e.target.value)
              if (status !== "idle") setStatus("idle")
            }}
            maxLength={100}
            required
            className="w-full rounded-xl border border-border/60 bg-background pl-9 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors"
            placeholder="Your full name"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          This is how your name appears across the platform.
        </p>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">Email address</label>
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/30 px-4 py-2.5">
          <span className="text-sm text-foreground flex-1 truncate">{email ?? "—"}</span>
          {emailVerified ? (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="size-3" /> Verified
            </span>
          ) : (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              <AlertCircle className="size-3" /> Unverified
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Email cannot be changed. Contact support if needed.
        </p>
      </div>

      {status === "error" && errorMsg && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </p>
      )}
      {status === "saved" && (
        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          Profile updated successfully.
        </p>
      )}

      <Button
        type="submit"
        disabled={!dirty || status === "saving"}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border-0 shadow-md shadow-indigo-500/20"
      >
        {status === "saving" && <Loader2 className="size-4 mr-2 animate-spin" />}
        Save changes
      </Button>
    </form>
  )
}

// ── Password section ──────────────────────────────────────────────────────────

function PasswordSection({ hasPassword }: { hasPassword: boolean }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (next !== confirm) {
      setErrorMsg("Passwords do not match.")
      setStatus("error")
      return
    }
    setStatus("saving")
    setErrorMsg("")
    try {
      const body: Record<string, string> = { newPassword: next }
      if (hasPassword) body.currentPassword = current

      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as {
        data?: { updated?: boolean }
        error?: { message?: string }
      }
      if (json.data?.updated) {
        setStatus("saved")
        setCurrent("")
        setNext("")
        setConfirm("")
        setTimeout(() => setStatus("idle"), 3000)
      } else {
        setErrorMsg(json.error?.message ?? "Something went wrong.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  const inputBase =
    "w-full rounded-xl border border-border/60 bg-background py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/40 transition-colors"

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
      {hasPassword && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="current-password">
            Current password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={current}
              onChange={(e) => {
                setCurrent(e.target.value)
                if (status !== "idle") setStatus("idle")
              }}
              autoComplete="current-password"
              required
              className={`${inputBase} pl-9 pr-10`}
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
            >
              {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="new-password">
            {hasPassword ? "New password" : "Password"}
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={next}
              onChange={(e) => {
                setNext(e.target.value)
                if (status !== "idle") setStatus("idle")
              }}
              autoComplete="new-password"
              required
              minLength={8}
              className={`${inputBase} pl-9 pr-10`}
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowNew((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground" htmlFor="confirm-password">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="confirm-password"
              type={showNew ? "text" : "password"}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value)
                if (status !== "idle") setStatus("idle")
              }}
              autoComplete="new-password"
              required
              minLength={8}
              className={`${inputBase} pl-9`}
              placeholder="Repeat new password"
            />
          </div>
        </div>
      </div>

      {/* Strength hint */}
      {next.length > 0 && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[8, 12, 16].map((threshold) => (
              <div
                key={threshold}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  next.length >= threshold
                    ? threshold === 8
                      ? "bg-amber-500"
                      : threshold === 12
                      ? "bg-emerald-500"
                      : "bg-indigo-500"
                    : "bg-muted/40"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {next.length < 8
              ? "Too short"
              : next.length < 12
              ? "Weak — try a longer password"
              : next.length < 16
              ? "Good"
              : "Strong"}
          </p>
        </div>
      )}

      {status === "error" && errorMsg && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {errorMsg}
        </p>
      )}
      {status === "saved" && (
        <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="size-4 shrink-0" />
          Password {hasPassword ? "updated" : "set"} successfully.
        </p>
      )}

      <Button
        type="submit"
        disabled={status === "saving"}
        variant="outline"
        className="border-border/60 hover:border-primary/40 hover:bg-primary/5"
      >
        {status === "saving" ? (
          <Loader2 className="size-4 mr-2 animate-spin" />
        ) : (
          <ShieldCheck className="size-4 mr-2" />
        )}
        {hasPassword ? "Update password" : "Set password"}
      </Button>
    </form>
  )
}

// ── Export ────────────────────────────────────────────────────────────────────

export function UpdateProfileForm({
  name,
  email,
  emailVerified,
  initials,
  hasPassword,
}: UpdateProfileFormProps) {
  return (
    <div className="space-y-8">
      <ProfileSection
        name={name}
        email={email}
        emailVerified={emailVerified}
        initials={initials}
      />

      <div className="border-t border-border/30" />

      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <h3 className="text-base font-semibold text-foreground">
            {hasPassword ? "Change password" : "Set a password"}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          {hasPassword
            ? "Update the password used to sign in with your email."
            : "Add a password so you can sign in with email and password in addition to your connected accounts."}
        </p>
        <PasswordSection hasPassword={hasPassword} />
      </div>
    </div>
  )
}
