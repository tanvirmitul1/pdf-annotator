import Link from "next/link"
import { redirect } from "next/navigation"

import { LogoMark } from "@/components/common/logo-mark"
import { GuestUpload } from "@/components/home/guest-upload"
import { getCurrentUser } from "@/lib/auth/require"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/common/theme-toggle"

export default async function HomePage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/app")
  }

  return (
    <main
      id="main-content"
      className="relative flex min-h-screen flex-col overflow-hidden"
    >
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_10%,transparent)_0,transparent_50%),radial-gradient(ellipse_at_bottom_right,color-mix(in_oklab,var(--accent)_10%,transparent)_0,transparent_45%)]" />

      {/* Top nav */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
        <LogoMark compact />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Central content */}
      <div className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 pb-16 pt-8 sm:px-8">
        <div className="w-full space-y-8 text-center">
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Upload and annotate
            </h1>
            <p className="text-base text-muted-foreground sm:text-lg">
              Drop a PDF or image — your annotations are ready in seconds.
            </p>
          </div>

          <div className="animate-in duration-500 fade-in-0 slide-in-from-bottom-4">
            <GuestUpload />
          </div>

          <p className="text-xs text-muted-foreground/60">
            No account required to preview. <Link href="/signup" className="underline underline-offset-4 hover:text-muted-foreground transition-colors">Create a free account</Link> to save your work.
          </p>
        </div>
      </div>
    </main>
  )
}
