"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Globe, LoaderCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import { type FormEvent, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type SignInValues = z.infer<typeof SignInSchema>

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [values, setValues] = useState<SignInValues>({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignInValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const callbackUrl = searchParams.get("callbackUrl") ?? "/app"

  async function handleCredentials(values: SignInValues) {
    setIsSubmitting(true)
    setErrors({})

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
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
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      return
    }

    await handleCredentials(parsed.data)
  }

  async function handleGoogle() {
    await signIn("google", { callbackUrl })
  }

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Login</CardTitle>
        <p className="text-sm text-muted-foreground">
          Continue with Google first, or use your email and password below.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button type="button" size="lg" className="w-full hover:bg-primary/90" onClick={() => void handleGoogle()}>
          <Globe className="size-4" />
          Continue with Google
        </Button>

        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span>Or use email</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            />
            <p className="min-h-5 text-sm text-destructive">{errors.email}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <Input
              id="login-password"
              type="password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            />
            <p className="min-h-5 text-sm text-destructive">{errors.password}</p>
          </div>
          <Button type="submit" size="lg" className="w-full hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Sign in
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
