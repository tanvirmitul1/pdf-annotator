import Link from "next/link"

import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignupPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr]">
        <section className="space-y-6">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Back home
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight">Create your account</h1>
          <p className="max-w-xl text-lg/8 text-muted-foreground">
            Start with a free account that already includes quotas, consent controls, and deletion
            safeguards so later features sit on a trustworthy base.
          </p>
          <div className="rounded-[2rem] border border-border bg-card/80 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Before you continue</p>
            <p className="mt-2">
              Review the{" "}
              <Link href="/privacy" className="text-foreground underline underline-offset-4">
                privacy policy
              </Link>{" "}
              and{" "}
              <Link href="/terms" className="text-foreground underline underline-offset-4">
                terms
              </Link>
              .
            </p>
          </div>
        </section>
        <SignUpForm />
      </div>
    </main>
  )
}
