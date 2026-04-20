import Link from "next/link"

import { SignInForm } from "@/components/auth/sign-in-form"

export default function LoginPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr]">
        <section className="space-y-6">
          <Link href="/" className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Back home
          </Link>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome back</h1>
          <p className="max-w-xl text-lg/8 text-muted-foreground">
            Sign in to manage your settings, review legal docs, and make sure the account layer feels
            solid before documents arrive.
          </p>
          <div className="rounded-[2rem] border border-border bg-card/80 p-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">Demo credentials</p>
            <p className="mt-2">Email: demo@example.com</p>
            <p>Password: Password123!</p>
          </div>
        </section>
        <SignInForm />
      </div>
    </main>
  )
}
