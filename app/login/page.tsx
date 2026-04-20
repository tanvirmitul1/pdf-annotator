import { Suspense } from "react"
import { LogIn } from "lucide-react"

import { SignInForm } from "@/components/auth/sign-in-form"

export default function LoginPage() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
            <LogIn className="size-3.5" />
            Protected scaffold
          </div>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-foreground">
            Sign in to the foundation layer.
          </h1>
          <p className="max-w-xl text-lg/8 text-muted-foreground">
            This phase locks down authentication, entitlements, and the protected app shell before
            document features arrive.
          </p>
        </section>
        <Suspense fallback={<div>Loading...</div>}>
          <SignInForm />
        </Suspense>
      </div>
    </main>
  )
}
