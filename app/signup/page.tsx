import { UserPlus } from "lucide-react"

import { SignUpForm } from "@/components/auth/sign-up-form"

export default function SignupPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            <UserPlus className="size-3.5" />
            Free plan bootstrap
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground">
            Create an account with SaaS foundations built in.
          </h1>
          <p className="max-w-xl text-lg/8 text-muted-foreground">
            New users start on the seeded free plan with usage rows initialized at zero from the
            moment the account is created.
          </p>
        </section>
        <SignUpForm />
      </div>
    </main>
  )
}
