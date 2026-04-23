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
      className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8"
    >
      {/* Glossy gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_12%,transparent)_0,transparent_40%),radial-gradient(circle_at_bottom_right,color-mix(in_oklab,var(--accent)_15%,transparent)_0,transparent_45%)]" />

      <div className="relative mx-auto max-w-3xl">
        {/* Top bar */}
        <div className="mb-16 flex items-center justify-between">
          <LogoMark />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-full bg-primary/90 hover:bg-primary"
            >
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>

        {/* Central upload section */}
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              Upload and annotate
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Drop a PDF or image to start.
            </p>
          </div>

          <div className="animate-in duration-500 fade-in-0 slide-in-from-bottom-4">
            <GuestUpload />
          </div>
        </div>
      </div>
    </main>
  )
}
