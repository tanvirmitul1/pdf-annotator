"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { LoaderCircle, LockKeyhole, Mail, UserRound } from "lucide-react"
import { signIn } from "next-auth/react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const SignUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept the Terms and Privacy policy.",
  }),
})

type SignUpValues = z.infer<typeof SignUpSchema>

export function SignUpForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const [values, setValues] = useState<SignUpValues>({
    name: "",
    email: "",
    password: "",
    acceptTerms: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

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

      const payload = (await response.json()) as { error?: { message?: string } }

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
        setErrors({ email: "Account created but login failed. Try signing in." })
        setIsSubmitting(false)
        return
      }

      router.push("/app")
      router.refresh()
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
    await signIn("google", { callbackUrl: "/app" })
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Get started with your documents
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-border/70 bg-card/70 hover:bg-accent/70"
        onClick={() => void handleGoogleSignup()}
      >
        <svg className="size-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Use email and password today, then attach Google whenever you are ready.
      </p>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="signup-name" className="text-xs">Name</Label>
        <div className="relative">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-name"
            value={values.name}
            onChange={(e) => setValues((c) => ({ ...c, name: e.target.value }))}
            className="h-10 rounded-xl border-border/70 bg-card/80 pl-10 text-sm"
          />
        </div>
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-email" className="text-xs">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((c) => ({ ...c, email: e.target.value }))}
            className="h-10 rounded-xl border-border/70 bg-card/80 pl-10 text-sm"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signup-password" className="text-xs">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signup-password"
            type="password"
            value={values.password}
            onChange={(e) => setValues((c) => ({ ...c, password: e.target.value }))}
            className="h-10 rounded-xl border-border/70 bg-card/80 pl-10 text-sm"
          />
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/70 bg-card/70 p-2.5 text-xs text-muted-foreground transition hover:border-primary/35">
        <input
          type="checkbox"
          className="mt-0.5 size-3.5 rounded"
          checked={values.acceptTerms}
          onChange={(e) => setValues((c) => ({ ...c, acceptTerms: e.target.checked }))}
        />
        <span>
          I agree to the{" "}
          <Link href="/terms" className="font-medium text-foreground underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="font-medium text-foreground underline">Privacy</Link>
        </span>
      </label>
      {errors.acceptTerms && <p className="text-xs text-destructive">{errors.acceptTerms}</p>}

      <Button
        type="submit"
        className="h-10 w-full rounded-xl text-sm"
        disabled={isSubmitting}
      >
        {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
        Create Account
      </Button>
    </form>
    </div>
  )
}
