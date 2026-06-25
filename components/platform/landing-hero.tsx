"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"
import { signIn } from "next-auth/react"

import { LogoMark } from "@/components/common/logo-mark"
import { ThemeToggle } from "@/components/common/theme-toggle"
import HeroBubbles from "@/components/platform/hero-bubbles"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

function DocIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="4" y="2" width="12" height="16" rx="2" fill="white" opacity={0.35} />
      <rect x="8" y="6" width="12" height="16" rx="2" fill="white" opacity={0.6} />
      <rect x="11" y="12" width="6" height="1.2" rx="0.6" fill="white" opacity={0.9} />
      <rect x="11" y="15" width="4" height="1.2" rx="0.6" fill="white" opacity={0.9} />
    </svg>
  )
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="10" r="7" fill="white" opacity={0.35} />
      <circle cx="12" cy="10" r="5" fill="white" opacity={0.6} />
      <circle cx="9" cy="10" r="1" fill="white" opacity={0.95} />
      <circle cx="12" cy="10" r="1" fill="white" opacity={0.95} />
      <circle cx="15" cy="10" r="1" fill="white" opacity={0.95} />
      <path d="M12 15 L10 19 L14 17 Z" fill="white" opacity={0.5} />
    </svg>
  )
}

const services = [
  {
    name: "Document Annotator",
    description:
      "Upload, annotate, and collaborate on PDF documents with powerful tagging, bookmarks, and organization.",
    icon: DocIcon,
    gradient: "from-blue-500 to-cyan-400",
    shadowColor: "shadow-blue-500/20",
    href: "/signup?callbackUrl=/services/documents",
  },
  {
    name: "AI Chat Assistant",
    description:
      "Intelligent chat powered by advanced AI — OCR, voice input, artifact generation, and file analysis.",
    icon: ChatIcon,
    gradient: "from-violet-500 to-fuchsia-400",
    shadowColor: "shadow-violet-500/20",
    href: "/signup?callbackUrl=/services/ai-chat",
  },
]

export function LandingHero() {
  const callbackUrl = "/dashboard"

  async function handleOAuthSignIn(provider: "google" | "github") {
    const width = 500
    const height = 620
    const left = window.screenX + Math.round((window.outerWidth - width) / 2)
    const top = window.screenY + Math.round((window.outerHeight - height) / 2)

    const result = await signIn(provider, {
      callbackUrl: "/auth/popup-success",
      redirect: false,
    })

    if (!result?.url) {
      await signIn(provider, { callbackUrl })
      return
    }

    const popup = window.open(
      result.url,
      `${provider}-signin`,
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    )

    if (!popup) {
      await signIn(provider, { callbackUrl })
      return
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if ((event.data as { type?: string })?.type === "OAUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage)
        clearInterval(closedPoller)
        window.location.href = callbackUrl
      }
    }

    const closedPoller = setInterval(() => {
      if (popup.closed) {
        clearInterval(closedPoller)
        window.removeEventListener("message", handleMessage)
      }
    }, 500)

    window.addEventListener("message", handleMessage)
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <HeroBubbles />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8"
      >
        <div className="flex items-center gap-2.5">
          <LogoMark compact />
          <span className="text-lg font-semibold tracking-tight">WorkHub</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </motion.header>

      {/* ── Hero Section ── */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-start px-6 pt-10 pb-16 text-center sm:pt-16">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="mb-16 space-y-7"
        >
          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Your Unified{" "}
            <span className="text-gradient">Workspace</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Annotate documents, chat with AI, and manage your workflow — all
            from a single dashboard built for focus.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-4 pt-2"
          >
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              {/* Primary CTA — Google */}
              <button
                type="button"
                onClick={() => void handleOAuthSignIn("google")}
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-white px-7 text-sm font-semibold text-neutral-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] dark:bg-white dark:text-neutral-700 sm:w-auto"
              >
                <svg viewBox="0 0 24 24" className="size-5 shrink-0">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              {/* Secondary CTA — GitHub */}
              <button
                type="button"
                onClick={() => void handleOAuthSignIn("github")}
                className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-card/80 px-7 text-sm font-semibold backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-foreground/15 hover:bg-card hover:shadow-lg hover:shadow-black/[0.06] active:scale-[0.98] sm:w-auto"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="size-4.5 shrink-0"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                Continue with GitHub
              </button>
            </div>

            <p className="text-xs text-muted-foreground/80">
              or{" "}
              <Link
                href="/login"
                className="font-medium text-foreground/70 underline decoration-foreground/20 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground/40"
              >
                sign in with email
              </Link>
            </p>
          </motion.div>
        </motion.div>

        {/* ── Service Cards ── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid w-full max-w-4xl gap-5 sm:grid-cols-2"
        >
          {services.map((service) => (
            <motion.div
              key={service.name}
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              <Link href={service.href} className="group block">
                <div
                  className={`relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 p-7 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-border hover:shadow-2xl ${service.shadowColor}`}
                >
                  {/* Top edge gradient accent */}
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r ${service.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-60`}
                  />

                  <div className="relative">
                    <div
                      className={`mb-4 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} shadow-lg ${service.shadowColor}`}
                    >
                      <service.icon className="size-5 text-white" />
                    </div>
                    <h3 className="mb-1.5 text-lg font-semibold tracking-tight">
                      {service.name}
                    </h3>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      {service.description}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Get started
                      <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/50 bg-card/40 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 py-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <LogoMark compact />
            <span className="font-medium text-muted-foreground">WorkHub</span>
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">
              &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="flex items-center gap-5 text-[13px] text-muted-foreground/70">
            <Link
              href="/privacy"
              className="transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/cookies"
              className="transition-colors hover:text-foreground"
            >
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
