import Link from "next/link"
import { CheckCircle2, FileBadge2, ShieldCheck, Sparkles } from "lucide-react"

import { LogoMark } from "@/components/common/logo-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface AuthShellProps {
  badge: string
  title: string
  description: string
  form: React.ReactNode
  mode: "login" | "signup"
}

const proofPoints = [
  {
    icon: ShieldCheck,
    title: "Security-first access",
    description:
      "JWT sessions, Google OAuth, credentials auth, and strict protected routes.",
  },
  {
    icon: FileBadge2,
    title: "Plan-aware from day one",
    description:
      "Every account starts on the seeded Free plan with tracked usage and clear limits.",
  },
  {
    icon: Sparkles,
    title: "Built for a polished client demo",
    description:
      "Responsive layouts, dark mode, focus-visible states, and motion that stays restrained.",
  },
]

export function AuthShell({
  badge,
  title,
  description,
  form,
  mode,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_18%,transparent)_0,transparent_35%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--accent)_22%,transparent)_0,transparent_30%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-7xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[1.08fr_0.92fr] xl:gap-12">
          <section className="glass-panel surface-border relative overflow-hidden rounded-[2rem] px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent dark:via-white/15" />
            <div className="space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <LogoMark />
                <Badge
                  variant="outline"
                  className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-primary uppercase"
                >
                  {badge}
                </Badge>
              </div>

              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[0.72rem] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                  <span className="size-2 rounded-full bg-primary" />
                  Production-ready account layer
                </div>
                <div className="space-y-3">
                  <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-6xl">
                    {title}
                  </h1>
                  <p className="max-w-2xl text-base leading-8 text-pretty text-muted-foreground sm:text-lg">
                    {description}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {proofPoints.map((point, index) => (
                  <article
                    key={point.title}
                    className={cn(
                      "surface-secondary rounded-[1.5rem] border border-border/60 p-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)]",
                      "animate-in duration-500 fade-in-0 slide-in-from-bottom-4"
                    )}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <point.icon className="size-5 text-primary" />
                    <h2 className="mt-4 font-heading text-base font-semibold tracking-tight text-foreground">
                      {point.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {point.description}
                    </p>
                  </article>
                ))}
              </div>

              <div className="surface-secondary flex flex-col gap-4 rounded-[1.75rem] border border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-lg font-semibold text-foreground">
                    Fast setup, no dead-end scaffolding
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Authentication, quotas, analytics gates, and the full app
                    shell are already wired.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-border/70 bg-card/70 hover:border-primary/35 hover:bg-accent/70"
                  >
                    <Link href="/terms">Terms</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-border/70 bg-card/70 hover:border-primary/35 hover:bg-accent/70"
                  >
                    <Link href="/privacy">Privacy</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <section className="glass-panel surface-border rounded-[2rem] p-3 sm:p-4 lg:p-5">
            <div className="surface-secondary rounded-[1.7rem] border border-border/60 p-4 sm:p-6">
              {form}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-3.5 text-primary" />
                Fully responsive on mobile, tablet, and desktop
              </div>
              <div>
                {mode === "login" ? "New here?" : "Already have access?"}{" "}
                <Link
                  href={mode === "login" ? "/signup" : "/login"}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  {mode === "login" ? "Create an account" : "Sign in"}
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
