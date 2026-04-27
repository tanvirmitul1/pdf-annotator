import Link from "next/link"

import { LogoMark } from "@/components/common/logo-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export interface LegalSection {
  title: string
  body: React.ReactNode
}

export interface LegalPageProps {
  eyebrow: string
  title: string
  description: string
  sections: LegalSection[]
}

export function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: LegalPageProps) {
  return (
    <main
      id="main-content"
      className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--accent)_16%,transparent)_0,transparent_28%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--primary)_14%,transparent)_0,transparent_30%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="glass-panel surface-border h-fit rounded-xl p-6 lg:sticky lg:top-6">
            <LogoMark />
            <Badge
              variant="outline"
              className="mt-8 rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-[0.68rem] tracking-[0.22em] text-primary uppercase"
            >
              {eyebrow}
            </Badge>
            <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              {description}
            </p>

            <nav className="mt-8 space-y-2">
              {sections.map((section, index) => (
                <a
                  key={section.title}
                  href={`#section-${index + 1}`}
                  className="flex rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/20 hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {section.title}
                </a>
              ))}
            </nav>

            <div className="mt-8 flex flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                className="rounded-full border-border/70 bg-card/70 hover:border-primary/35 hover:bg-accent/70"
              >
                <Link href="/">Back home</Link>
              </Button>
              <Button asChild className="rounded-full">
                <Link href="/signup">Create account</Link>
              </Button>
            </div>
          </aside>

          <section className="glass-panel surface-border rounded-xl p-4 sm:p-6 lg:p-8">
            <div className="space-y-4 rounded-xl border border-border/60 bg-card/65 p-5 sm:p-7">
              {sections.map((section, index) => (
                <article
                  key={section.title}
                  id={`section-${index + 1}`}
                  className="surface-secondary rounded-lg border border-border/55 p-5 sm:p-6"
                >
                  <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
                    Section {index + 1}
                  </p>
                  <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight text-foreground">
                    {section.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-sm leading-7 text-muted-foreground">
                    {section.body}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
