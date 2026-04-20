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
import { SignUpSchema } from "@/features/auth/schema"
import { makeZodResolver } from "@/lib/forms/zod-resolver"

type SignUpInput = z.infer<typeof SignUpSchema>

export function SignUpForm() {
  const router = useRouter()
  const [serverMessage, setServerMessage] = React.useState("")
  const form = useForm<SignUpInput>({
    resolver: makeZodResolver(SignUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: SignUpInput) {
    setServerMessage("")
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    if (!response.ok) {
      const payload = (await response.json()) as { error?: { message?: string } }
      setServerMessage(payload.error?.message ?? "Signup failed")
      return
    }

    router.push("/app")
    router.refresh()
  }

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-lg">
      <CardHeader className="space-y-3">
        <CardTitle className="text-2xl">Create account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Start with the free plan. Billing can come later without reshaping the app.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={form.handleSubmit((values) => void onSubmit(values))}>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              autoComplete="name"
              {...form.register("displayName")}
              aria-invalid={form.formState.errors.displayName ? "true" : "false"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              {...form.register("email")}
              aria-invalid={form.formState.errors.email ? "true" : "false"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
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
            {form.formState.isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p role="status" aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
          {serverMessage}
        </p>

        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
