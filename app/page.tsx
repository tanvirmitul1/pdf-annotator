import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main id="main-content" className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase">
          PDF Annotator
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hover:bg-accent">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild className="hover:bg-primary/90">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="grid flex-1 items-center gap-10 py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">
            Trust & account layer
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-foreground sm:text-6xl">
            Build your study library on infrastructure people can trust.
          </h1>
          <p className="max-w-2xl text-lg/8 text-muted-foreground">
            This phase lays down the settings, legal, email, consent, and account controls that make
            the rest of the document experience feel safe from day one.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="hover:bg-primary/90">
              <Link href="/signup">Start on the free plan</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="hover:bg-accent">
              <Link href="/terms">Read the legal pages</Link>
            </Button>
          </div>
          <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-border bg-card/70 p-4">Consent-aware analytics</div>
            <div className="rounded-[1.5rem] border border-border bg-card/70 p-4">Queued transactional email</div>
            <div className="rounded-[1.5rem] border border-border bg-card/70 p-4">7-day account deletion grace</div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-xl">
          <div className="rounded-[1.75rem] border border-border bg-background p-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="text-sm font-semibold">Account health</p>
                <p className="text-sm text-muted-foreground">Settings, usage, and trust signals in one place.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Free plan
              </span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.25rem] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Profile</p>
                <p className="mt-2 text-sm text-muted-foreground">Display name, provider badge, and avatar fallback.</p>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Plan & Usage</p>
                <div className="mt-3 h-3 rounded-full bg-muted">
                  <div className="h-full w-1/3 rounded-full bg-primary" />
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-border bg-muted/40 p-4">
                <p className="text-sm font-semibold">Danger Zone</p>
                <p className="mt-2 text-sm text-muted-foreground">Export, deletion grace period, and restore controls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="/cookies" className="hover:text-foreground">
          Cookies
        </Link>
        <Link href="/login" className="hover:text-foreground">
          Login
        </Link>
      </footer>
    </main>
  )
}
