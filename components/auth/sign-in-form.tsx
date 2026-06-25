"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { type FormEvent, useState } from "react"
import { LoaderCircle, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { signIn } from "next-auth/react"
import { z } from "zod"

import { Button } from "@/components/ui/button"

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type SignInValues = z.infer<typeof SignInSchema>

interface SignInFormProps {
  compact?: boolean
  callbackUrl?: string
  onSwitchToSignUp?: () => void
}

export function SignInForm({ callbackUrl: propCallbackUrl, onSwitchToSignUp }: SignInFormProps) {
  const searchParams = useSearchParams()
  const [values, setValues] = useState<SignInValues>({ email: "", password: "" })
  const [errors, setErrors] = useState<Partial<Record<keyof SignInValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const callbackUrl = propCallbackUrl ?? searchParams.get("callbackUrl") ?? "/dashboard"

  async function handleSignIn() {
    setIsSubmitting(true)
    setErrors({})

    const parsed = SignInSchema.safeParse(values)
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SignInValues, string>> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (typeof field === "string" && !(field in nextErrors)) {
          nextErrors[field as keyof SignInValues] = issue.message
        }
      }
      setErrors(nextErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl,
      })

      if (result?.error) {
        setErrors({ password: "Incorrect email or password." })
        setIsSubmitting(false)
        return
      }

      window.location.href = callbackUrl
    } catch (error) {
      console.error(error)
      setErrors({ password: "Network error. Please try again." })
      setIsSubmitting(false)
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await handleSignIn()
  }

  async function handleOAuthSignIn(provider: "google" | "github") {
    const width = 500
    const height = 620
    const left = window.screenX + Math.round((window.outerWidth - width) / 2)
    const top = window.screenY + Math.round((window.outerHeight - height) / 2)

    const result = await signIn(provider, {
      callbackUrl: "/auth/popup-success",
      redirect: false,
    })

    if (!result?.url) {
      await signIn(provider, { callbackUrl })
      return
    }

    const popup = window.open(
      result.url,
      `${provider}-signin`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`,
    )

    if (!popup) {
      await signIn(provider, { callbackUrl })
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: string })?.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage)
        clearInterval(closedPoller)
        window.location.href = callbackUrl
      }
    }

    const closedPoller = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedPoller)
        window.removeEventListener("message", handleMessage)
      }
    }, 500)

    window.addEventListener("message", handleMessage)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Bottom gradient — adapts to light/dark via CSS vars */}
      <div className="auth-card-gradient auth-card-gradient--signin" aria-hidden="true" />

      <div className="relative z-10 px-8 pb-8 pt-8 flex flex-col gap-5">
        {/* Title */}
        <h1 className="text-[2rem] font-bold text-center text-foreground tracking-tight leading-tight">
          Sign in
        </h1>

        {/* Social buttons */}
        <div className="flex items-center justify-center gap-3">
          {/* Google */}
          <button
            type="button"
            aria-label="Continue with Google"
            title="Continue with Google"
            className="auth-social-btn"
            onClick={() => void handleOAuthSignIn("google")}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </button>

          {/* GitHub */}
          <button
            type="button"
            aria-label="Continue with GitHub"
            title="Continue with GitHub"
            className="auth-social-btn"
            onClick={() => void handleOAuthSignIn("github")}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-foreground">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </button>
        </div>

        {/* OR divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-medium tracking-widest">OR</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Form */}
        <form className="flex flex-col gap-3" onSubmit={(e) => void onSubmit(e)}>
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
            <input
              id="signin-email"
              type="email"
              placeholder="Email Address"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues((c) => ({ ...c, email: e.target.value }))}
              className="auth-pill-input pl-10 pr-4"
            />
          </div>
          {errors.email && <p className="text-xs text-destructive -mt-1 pl-4">{errors.email}</p>}

          {/* Password */}
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
            <input
              id="signin-password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) => setValues((c) => ({ ...c, password: e.target.value }))}
              className="auth-pill-input pl-10 pr-12"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive -mt-1 pl-4">{errors.password}</p>}

          {/* Forgot password */}
          <div className="text-right -mt-1">
            <Link
              href="/forgot-password"
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-lg font-semibold text-sm shadow-sm transition-all duration-200 mt-1"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Switch to sign-up */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-foreground font-bold hover:underline transition-all"
          >
            Sign up!
          </button>
        </p>

        {/* Legal footer */}
        <p className="text-center text-xs text-muted-foreground leading-relaxed">
          If you continue, you agree to the{" "}
          <Link href="/terms" className="text-foreground underline underline-offset-2 font-medium hover:text-primary transition-colors">
            Terms of Service
          </Link>
          {" & "}
          <Link href="/privacy" className="text-foreground underline underline-offset-2 font-medium hover:text-primary transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
