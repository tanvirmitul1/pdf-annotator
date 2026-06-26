"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
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

  const searchParams = useSearchParams()
  const callbackUrl = propCallbackUrl ?? searchParams.get("callbackUrl") ?? "/dashboard"

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

  async function handleOAuthSignup(provider: "google" | "github") {
    await signIn(provider, { callbackUrl })
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
          {/* Google */}
          <button
            type="button"
            aria-label="Continue with Google"
            title="Continue with Google"
            className="auth-social-btn"
            onClick={() => void handleOAuthSignup("google")}
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

          {/* GitHub */}
          <button
            type="button"
            aria-label="Continue with GitHub"
            title="Continue with GitHub"
            className="auth-social-btn"
            onClick={() => void handleOAuthSignup("github")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-foreground">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
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
            className="mt-2 h-11 w-full rounded-lg text-sm font-semibold shadow-sm transition-all duration-200"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

      </div>
    </div>
  )
}
