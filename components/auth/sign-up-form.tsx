"use client"

import Link from "next/link"
import { type FormEvent, useState } from "react"
import { LoaderCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"
import { z } from "zod"

import { Button } from "@/components/ui/button"

const SignUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, "You must accept the terms"),
})

type SignUpValues = z.infer<typeof SignUpSchema>

interface SignUpFormProps {
  compact?: boolean
  callbackUrl?: string
  onSwitchToSignIn?: () => void
}

export function SignUpForm({
  callbackUrl: propCallbackUrl,
  onSwitchToSignIn,
}: SignUpFormProps) {
  const [values, setValues] = useState<SignUpValues>({
    name: "",
    email: "",
    password: "",
    acceptTerms: true,
  })
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignUpValues, string>>
  >({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const callbackUrl = propCallbackUrl ?? "/app"

  async function handleSignup() {
    setIsSubmitting(true)
    setErrors({})

    const parsed = SignUpSchema.safeParse(values)
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SignUpValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && !(field in nextErrors)) {
          nextErrors[field as keyof SignUpValues] = issue.message
        }
      }
      setErrors(nextErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })

      const payload = (await response.json()) as {
        error?: { message?: string }
      }

      if (!response.ok) {
        setErrors({ email: payload.error?.message ?? "Signup failed." })
        setIsSubmitting(false)
        return
      }

      const signInResult = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      })

      if (signInResult?.error) {
        setErrors({
          email: "Account created but login failed. Try signing in.",
        })
        setIsSubmitting(false)
        return
      }

      window.location.href = callbackUrl
    } catch (error) {
      console.error(error)
      setErrors({ email: "Network error. Please try again." })
      setIsSubmitting(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await handleSignup()
  }

  async function handleGoogleSignup() {
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="relative overflow-hidden">
      {/* Bottom gradient — adapts to light/dark via CSS vars */}
      <div
        className="auth-card-gradient auth-card-gradient--signup"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-5 px-8 pt-8 pb-8">
        {/* Title */}
        <h1 className="text-center text-[2rem] leading-tight font-bold tracking-tight text-foreground">
          Create an Account
        </h1>

        {/* Social buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Apple */}
          <button
            type="button"
            aria-label="Continue with Apple"
            title="Continue with Apple"
            className="auth-social-btn"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-5 w-5 text-foreground"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
          </button>

          {/* Google */}
          <button
            type="button"
            aria-label="Continue with Google"
            title="Continue with Google"
            className="auth-social-btn"
            onClick={() => void handleGoogleSignup()}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </button>

          {/* Facebook */}
          <button
            type="button"
            aria-label="Continue with Facebook"
            title="Continue with Facebook"
            className="auth-social-btn"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5">
              <circle cx="12" cy="12" r="12" fill="#1877F2" />
              <path
                fill="white"
                d="M16.671 15.469l.445-2.904h-2.783v-1.884c0-.794.389-1.567 1.637-1.567h1.267V6.687S16.124 6.5 15.017 6.5c-2.294 0-3.794 1.39-3.794 3.908v2.157H8.609v2.904h2.614V22.5c.524.082 1.063.125 1.612.125s1.088-.043 1.612-.125v-7.031h2.224z"
              />
            </svg>
          </button>
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-widest text-muted-foreground">
            OR
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => void onSubmit(e)}
        >
          {/* Name */}
          <div className="relative">
            <svg
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              id="signup-name"
              type="text"
              placeholder="Full Name"
              autoComplete="name"
              value={values.name}
              onChange={(e) =>
                setValues((c) => ({ ...c, name: e.target.value }))
              }
              className="auth-pill-input pr-4 pl-10"
            />
          </div>
          {errors.name && (
            <p className="-mt-1 pl-4 text-xs text-destructive">{errors.name}</p>
          )}

          {/* Email */}
          <div className="relative">
            <Mail
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              id="signup-email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
              value={values.email}
              onChange={(e) =>
                setValues((c) => ({ ...c, email: e.target.value }))
              }
              className="auth-pill-input pr-4 pl-10"
            />
          </div>
          {errors.email && (
            <p className="-mt-1 pl-4 text-xs text-destructive">
              {errors.email}
            </p>
          )}

          {/* Password */}
          <div className="relative">
            <Lock
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              value={values.password}
              onChange={(e) =>
                setValues((c) => ({ ...c, password: e.target.value }))
              }
              className="auth-pill-input pr-12 pl-10"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="-mt-1 pl-4 text-xs text-destructive">
              {errors.password}
            </p>
          )}

          {/* Terms Checkbox */}
          <label className="group flex cursor-pointer items-start gap-2 px-1">
            <input
              type="checkbox"
              checked={values.acceptTerms}
              onChange={(e) =>
                setValues((c) => ({ ...c, acceptTerms: e.target.checked }))
              }
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs leading-relaxed text-muted-foreground">
              I agree to the{" "}
              <Link
                href="/terms"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
              >
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="-mt-2 pl-1 text-xs text-destructive">
              {errors.acceptTerms}
            </p>
          )}

          {/* Submit */}
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !values.acceptTerms ||
              !values.name.trim() ||
              !values.email.trim() ||
              !values.password
            }
            className="mt-2 h-12 w-full rounded-full text-base font-semibold shadow-sm transition-all duration-200"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {/* Switch to sign-in */}
        <p className="text-center text-sm text-muted-foreground">
          Do you have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-bold text-foreground transition-all hover:underline"
          >
            Sign in!
          </button>
        </p>

        {/* Legal footer */}
        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          If you continue, you agree to the{" "}
          <Link
            href="/terms"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            Terms of Service
          </Link>
          {" & "}
          <Link
            href="/privacy"
            className="font-medium text-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
