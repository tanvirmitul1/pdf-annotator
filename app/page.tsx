import Link from "next/link"
import { ShieldCheck, DatabaseZap, Gauge } from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    title: "Authentication",
    description:
      "Google OAuth, credentials auth, JWT sessions, and protected app routes.",
    icon: ShieldCheck,
  },
  {
    title: "Entitlements",
    description:
      "Free plan seeding, usage counters, and assertCanPerform quota gates.",
    icon: DatabaseZap,
  },
  {
    title: "Infrastructure",
    description:
      "Typed errors, audit logging, rate limiting, Redux, Sentry, and PostHog hooks.",
    icon: Gauge,
  },
]

export default function MarketingPage() {
  return (
    <main id="main-content" className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.24em] text-muted-foreground uppercase">
            PDF Annotator
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight text-foreground">
            Scaffold the SaaS foundations first.
          </h1>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="hover:bg-accent">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="hover:bg-primary/90">
            <Link href="/signup">Create account</Link>
          </Button>
        </div>
      </header>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm"
          >
            <feature.icon className="size-8 text-primary" />
            <h2 className="mt-4 text-xl font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm/7 text-muted-foreground">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  )
}
