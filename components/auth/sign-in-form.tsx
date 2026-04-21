"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { LoaderCircle, LockKeyhole, Mail } from "lucide-react"
import { signIn } from "next-auth/react"
import { type FormEvent, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type SignInValues = z.infer<typeof SignInSchema>

export function SignInForm({ compact = false }: { compact?: boolean }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [values, setValues] = useState<SignInValues>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignInValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const callbackUrl = searchParams.get("callbackUrl") ?? "/app"

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

      router.push(callbackUrl)
      router.refresh()
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

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl })
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to your account
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl border-border/70 bg-card/70 hover:bg-accent/70"
        onClick={() => void handleGoogleSignIn()}
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

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">OR</span>
        <Separator className="flex-1" />
      </div>

      <form className="space-y-3" onSubmit={(event) => void onSubmit(event)}>
      <div className="space-y-1.5">
        <Label htmlFor="signin-email" className="text-xs">Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((c) => ({ ...c, email: e.target.value }))}
            className="h-10 rounded-xl border-border/70 bg-card/80 pl-10 text-sm"
          />
        </div>
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="signin-password" className="text-xs">Password</Label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="signin-password"
            type="password"
            value={values.password}
            onChange={(e) => setValues((c) => ({ ...c, password: e.target.value }))}
            className="h-10 rounded-xl border-border/70 bg-card/80 pl-10 text-sm"
          />
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button
        type="submit"
        className="h-10 w-full rounded-xl text-sm"
        disabled={isSubmitting}
      >
        {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
        Sign In
      </Button>
    </form>
    </div>
  )
}
