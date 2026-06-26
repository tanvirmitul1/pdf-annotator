import Link from "next/link"

import { LogoMark } from "@/components/common/logo-mark"

export interface AuthShellProps {
  badge: string
  title: string
  description: string
  form: React.ReactNode
  /** Link shown next to the logo — e.g. "Already have an account? Log in" */
  switchHref: string
  switchLabel: string
  switchPrompt: string
}

export function AuthShell({ form, switchHref, switchLabel, switchPrompt }: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-16"
    >
      {/* ── Background: same smooth streaming light as landing ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Top-right streaming blob — adapts light/dark via CSS vars */}
        <div
          className="absolute -right-[8%] -top-[12%] h-[85vh] w-[72vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 68% 18%, var(--blob-fill-a) 0%, var(--blob-fill-b) 40%, transparent 68%)",
          }}
        />
        {/* Directional stream: right → center */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 58% 78% at 86% 44%, color-mix(in oklab, var(--primary) 8%, transparent) 0%, transparent 62%)",
          }}
        />
        {/* Center ambient glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 38% 42% at 66% 40%, color-mix(in oklab, var(--foreground) 6%, transparent) 0%, transparent 58%)",
          }}
        />
        {/* Bottom-left soft blob — adapts light/dark via CSS vars */}
        <div
          className="absolute -bottom-[12%] -left-[6%] h-[62vh] w-[58vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 28% 72%, var(--blob-fill-c) 0%, var(--blob-fill-d) 38%, transparent 65%)",
          }}
        />
      </div>

      {/* ── Navbar ── */}
      <nav className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border/40 bg-background/25 px-6 py-4 backdrop-blur-md sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <LogoMark compact />
          <span className="text-lg font-semibold tracking-tight">WorkHub</span>
        </Link>
        <p className="text-sm text-muted-foreground">
          {switchPrompt}{" "}
          <Link
            href={switchHref}
            className="font-semibold text-foreground transition-colors hover:text-primary"
          >
            {switchLabel}
          </Link>
        </p>
      </nav>

      {/* ── Centered card ── */}
      <div className="relative z-10 w-full max-w-[400px]">
        {/* Logo mark */}
        <div className="mb-6 flex justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-sm">
            <LogoMark compact />
          </div>
        </div>

        {/* Form card */}
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur-sm">
          {form}
        </div>

        {/* Single legal line — only place it appears */}
        <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground/70">
          By continuing, you agree to our{" "}
          <Link
            href="/terms"
            className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Terms
          </Link>
          ,{" "}
          <Link
            href="/terms#acceptable-use"
            className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Acceptable Use
          </Link>
          , and{" "}
          <Link
            href="/privacy"
            className="text-muted-foreground underline underline-offset-2 transition-colors hover:text-foreground"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  )
}
