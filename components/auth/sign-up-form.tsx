"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { signIn } from "next-auth/react"
import { type FormEvent, useState } from "react"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const SignUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.boolean().refine((value) => value, {
    message: "You must accept the Terms and Privacy policy.",
  }),
})

type SignUpValues = z.infer<typeof SignUpSchema>

export function SignUpForm() {
  const router = useRouter()
  const [values, setValues] = useState<SignUpValues>({
    name: "",
    email: "",
    password: "",
    acceptTerms: true,
  })
  const [errors, setErrors] = useState<Partial<Record<keyof SignUpValues, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(values: SignUpValues) {
    setIsSubmitting(true)
    setErrors({})

    const response = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })

    const payload = (await response.json()) as { error?: { message?: string } }

    if (!response.ok) {
      setErrors({ email: payload.error?.message ?? "Signup failed." })
      setIsSubmitting(false)
      return
    }

    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    router.push("/app")
    router.refresh()
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

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
      return
    }

    await handleSubmit(parsed.data)
  }

  return (
    <Card className="rounded-[2rem] border-border/70 bg-card/90 shadow-xl">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl">Create account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Use email and password today, then attach Google whenever you are ready.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
          <div className="space-y-2">
            <Label htmlFor="signup-name">Display name</Label>
            <Input
              id="signup-name"
              value={values.name}
              onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            />
            <p className="min-h-5 text-sm text-destructive">{errors.name}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email">Email address</Label>
            <Input
              id="signup-email"
              type="email"
              value={values.email}
              onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
            />
            <p className="min-h-5 text-sm text-destructive">{errors.email}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={values.password}
              onChange={(event) => setValues((current) => ({ ...current, password: event.target.value }))}
            />
            <p className="min-h-5 text-sm text-destructive">{errors.password}</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground hover:border-primary/40">
            <input
              type="checkbox"
              className="mt-1"
              checked={values.acceptTerms}
              onChange={(event) => setValues((current) => ({ ...current, acceptTerms: event.target.checked }))}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-foreground underline underline-offset-4">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-foreground underline underline-offset-4">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <p className="min-h-5 text-sm text-destructive">{errors.acceptTerms}</p>
          <Button type="submit" size="lg" className="w-full hover:bg-primary/90" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Create account
          </Button>
        </form>

        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
