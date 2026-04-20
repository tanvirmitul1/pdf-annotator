"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CredentialsSignInSchema } from "@/features/auth/schema"
import { makeZodResolver } from "@/lib/forms/zod-resolver"

type CredentialsSignInInput = z.infer<typeof CredentialsSignInSchema>

export function SignInForm() {
  const router = useRouter()
  const [serverMessage, setServerMessage] = React.useState("")
  const [googlePending, setGooglePending] = React.useState(false)

  const form = useForm<CredentialsSignInInput>({
    resolver: makeZodResolver(CredentialsSignInSchema),
    defaultValues: {
      method: "credentials",
      email: "demo@example.com",
      password: "Password123!",
    },
  })

  async function onSubmit(values: CredentialsSignInInput) {
    setServerMessage("")
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setServerMessage(payload.error?.message ?? "Sign-in failed")
      return
    }

    router.push("/app")
    router.refresh()
  }

  async function signInWithGoogle() {
    setGooglePending(true)
    setServerMessage("")

    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ method: "google" }),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setServerMessage(payload.error?.message ?? "Google sign-in failed")
      setGooglePending(false)
      return
    }

    router.push("/app")
    router.refresh()
  }

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-lg">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Sign in</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use the seeded credentials account or jump in with the Google demo user.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              aria-invalid={form.formState.errors.email ? "true" : "false"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              {...form.register("password")}
              aria-invalid={form.formState.errors.password ? "true" : "false"}
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full hover:bg-primary/90"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full hover:bg-accent"
          onClick={() => void signInWithGoogle()}
          disabled={googlePending}
        >
          {googlePending ? "Opening Google demo..." : "Continue with Google"}
        </Button>

        <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {serverMessage}
        </p>

        <div className="text-sm text-muted-foreground">
          Need an account?{" "}
          <Link href="/signup" className="font-medium text-foreground underline underline-offset-4">
            Create one
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
