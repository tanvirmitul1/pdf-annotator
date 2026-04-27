import Link from "next/link"
import { FileText, FolderKanban, Users } from "lucide-react"

import { LogoMark } from "@/components/common/logo-mark"
import { cn } from "@/lib/utils"

export interface AuthShellProps {
  badge: string
  title: string
  description: string
  form: React.ReactNode
  mode: "login" | "signup"
}

const features = [
  {
    icon: FileText,
    title: "Annotate any PDF",
    description:
      "Highlight, draw, and comment on any document with precision and ease.",
  },
  {
    icon: Users,
    title: "Real-time collaboration",
    description:
      "Invite teammates, share access, and review together seamlessly.",
  },
  {
    icon: FolderKanban,
    title: "Organized library",
    description:
      "Tag, categorize, and find your documents in seconds — not minutes.",
  },
]

export function AuthShell({
  title,
  description,
  form,
  mode,
}: AuthShellProps) {
  return (
    <main
      id="main-content"
      className="relative min-h-screen overflow-hidden"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_14%,transparent)_0,transparent_40%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--accent)_16%,transparent)_0,transparent_38%)]" />

      <div className="relative flex min-h-screen">
        {/* Left panel — product information */}
        <div className="hidden flex-col justify-between border-r border-border/50 bg-card/40 px-10 py-10 backdrop-blur-sm lg:flex lg:w-[46%] xl:w-[42%]">
          <LogoMark />

          <div className="space-y-10">
            <div className="space-y-4">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground xl:text-5xl">
                Read, mark, <br />
                <span className="text-primary">collaborate.</span>
              </h1>
              <p className="max-w-sm text-base leading-7 text-muted-foreground">
                The annotation workspace that keeps your team aligned without
                the noise.
              </p>
            </div>

            <div className="space-y-5">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex items-start gap-4",
                    "animate-in duration-500 fade-in-0 slide-in-from-left-4"
                  )}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
                    <feature.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {feature.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 sm:px-10">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <LogoMark />
          </div>

          <div className="w-full max-w-sm space-y-6">
            <div className="space-y-1.5">
              <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur-sm">
              {form}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
