"use client"

import Link from "next/link"
import {
  FileText,
  MessageSquare,
  Sparkles,
  Lock,
  ChevronDown,
  ArrowRight,
} from "lucide-react"
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

const NAV_ITEMS = [
  {
    label: "Features",
    items: [
      {
        label: "Document Annotator",
        description: "Highlight, comment & organize PDFs",
        href: "/features/documents",
      },
      {
        label: "AI Chat Assistant",
        description: "AI chat with file analysis & voice",
        href: "/features/ai-chat",
      },
      {
        label: "Unified Dashboard",
        description: "All tools in one focused workspace",
        href: "/features",
      },
    ],
  },
  {
    label: "Docs",
    items: [
      {
        label: "Getting Started",
        description: "Set up your workspace in minutes",
        href: "/docs/getting-started",
      },
      {
        label: "API Reference",
        description: "Integrate via our developer API",
        href: "/docs/api",
      },
      {
        label: "Guides",
        description: "Deep dives into features & workflows",
        href: "/docs/guides",
      },
    ],
  },
  {
    label: "Pricing",
    items: [
      {
        label: "Free Plan",
        description: "Core features, forever free",
        href: "/pricing#free",
      },
      {
        label: "Pro Plan",
        description: "Advanced tools for power users",
        href: "/pricing#pro",
      },
      {
        label: "Enterprise",
        description: "Custom plans for teams",
        href: "/pricing#enterprise",
      },
    ],
  },
] as const

const services = [
  {
    name: "Document Annotator",
    tagline: "Your PDF workflow, supercharged.",
    description:
      "Upload any PDF or image and annotate it with precision. Add highlights, comments, tags, and bookmarks. Collaborate with teammates in real time.",
    icon: FileText,
    gradient: "from-blue-500 to-cyan-400",
    glowColor: "#3b82f6",
    href: "/signup?callbackUrl=/services/documents",
    features: [
      "Highlight, underline & draw on any PDF",
      "Threaded comments and @mentions",
      "Tags, bookmarks & collections",
      "Full-text search across documents",
      "Share with view-only or edit access",
    ],
    comingSoon: false,
  },
  {
    name: "AI Chat Assistant",
    tagline: "Intelligent answers, instantly.",
    description:
      "A powerful AI assistant with OCR, voice input, and the ability to generate artifacts, analyze uploaded files, and answer complex questions.",
    icon: MessageSquare,
    gradient: "from-violet-500 to-fuchsia-400",
    glowColor: "#8b5cf6",
    href: "/signup?callbackUrl=/services/ai-chat",
    features: [
      "Context-aware AI conversations",
      "Upload files and get instant analysis",
      "Voice input & speech synthesis",
      "Code, HTML, and diagram artifacts",
      "Persistent conversation history",
    ],
    comingSoon: false,
  },
  {
    name: "More Coming Soon",
    tagline: "We're just getting started.",
    description:
      "New productivity services are in active development. Sign up now to get early access as each new tool launches.",
    icon: Sparkles,
    gradient: "from-orange-400 to-rose-400",
    glowColor: "#f97316",
    href: null,
    features: [
      "Spreadsheet & data tools",
      "Team knowledge base",
      "Calendar & scheduling",
      "Project management",
      "Integrations & API access",
    ],
    comingSoon: true,
  },
] as const

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
      {/* ── Bubbles: full-screen, cluster at right-center ── */}
      <HeroBubbles />

      {/* ── Background: smooth streaming light (no hard shapes) ── */}
      <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
        {/* Top-right streaming blob — uses CSS vars that adapt light/dark */}
        <div
          className="absolute -right-[8%] -top-[12%] h-[85vh] w-[72vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 68% 18%, var(--blob-fill-a) 0%, var(--blob-fill-b) 40%, transparent 68%)",
          }}
        />

        {/* Directional stream: right → center (primary-tinted light beam) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 58% 78% at 86% 44%, color-mix(in oklab, var(--primary) 8%, transparent) 0%, transparent 62%)",
          }}
        />

        {/* Center ambient glow — soft halo near bubble cluster */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 38% 42% at 66% 40%, color-mix(in oklab, var(--foreground) 6%, transparent) 0%, transparent 58%)",
          }}
        />

        {/* Bottom-left soft blob — adapts light/dark */}
        <div
          className="absolute -bottom-[12%] -left-[6%] h-[62vh] w-[58vw] blur-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 28% 72%, var(--blob-fill-c) 0%, var(--blob-fill-d) 38%, transparent 65%)",
          }}
        />
      </div>

      {/* ── First viewport: navbar + hero always fill exactly one screen ── */}
      <div className="relative flex min-h-screen flex-col">

      {/* ── Navbar ── */}
      <motion.header
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-20 flex items-center justify-between border-b border-border/40 bg-background/25 px-6 py-4 backdrop-blur-md sm:px-10"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 focus-visible:outline-none">
          <LogoMark compact />
          <span className="text-lg font-semibold tracking-tight">WorkHub</span>
        </Link>

        {/* Center nav with dropdowns */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {NAV_ITEMS.map((nav) => (
            <div key={nav.label} className="group relative">
              <button
                type="button"
                className="flex items-center gap-1 rounded-md px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
              >
                {nav.label}
                <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180" />
              </button>

              {/* Dropdown panel */}
              <div className="invisible absolute left-1/2 top-full z-50 mt-2 w-60 -translate-x-1/2 rounded-xl border border-border/60 bg-card/95 p-1.5 opacity-0 shadow-xl backdrop-blur-xl transition-all duration-150 group-hover:visible group-hover:opacity-100">
                {/* Arrow */}
                <div className="absolute -top-[5px] left-1/2 -translate-x-1/2">
                  <div className="size-2.5 rotate-45 border-l border-t border-border/60 bg-card/95" />
                </div>

                {nav.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="group/item flex flex-col rounded-lg px-3.5 py-2.5 transition-colors hover:bg-accent/10"
                  >
                    <span className="text-sm font-medium text-foreground group-hover/item:text-primary">
                      {item.label}
                    </span>
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/auth/login"
            className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Log in
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-semibold text-background transition-all hover:opacity-90 active:scale-[0.98]"
          >
            Get started
          </Link>
        </div>
      </motion.header>

      {/* ── Hero: left-side text, bubbles visible across full screen ── */}
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-16 sm:px-10 lg:py-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="w-full max-w-[560px] space-y-8"
        >
          {/* Badge pill
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
            <span className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
              <span className="size-1.5 rounded-full bg-primary" />
              Unified productivity platform
            </span>
          </motion.div> */}

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="font-heading text-5xl font-bold leading-[1.06] tracking-tight sm:text-6xl lg:text-[4.25rem]"
          >
            Tools built for
            <br />
            <span className="text-gradient">focused work.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Annotate documents, chat with AI, and manage your workflow — all
            from a single dashboard built for focus.
          </motion.p>

          {/* OAuth CTAs */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            {/* Google */}
            <button
              type="button"
              onClick={() => void handleOAuthSignIn("google")}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-border/50 bg-card/40 px-7 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/60 hover:shadow-lg active:scale-[0.98] sm:w-auto"
            >
              {/* Gloss sheen */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-xl bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />
              <svg viewBox="0 0 24 24" className="relative size-5 shrink-0" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="relative">Continue with Google</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => void handleOAuthSignIn("github")}
              className="group relative inline-flex h-12 w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl border border-border/50 bg-card/40 px-7 text-sm font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-border/70 hover:bg-card/60 hover:shadow-lg active:scale-[0.98] sm:w-auto"
            >
              {/* Gloss sheen */}
              <span className="pointer-events-none absolute inset-x-0 top-0 h-[45%] rounded-t-xl bg-gradient-to-b from-white/30 to-transparent dark:from-white/10" />
              <svg viewBox="0 0 24 24" fill="currentColor" className="relative size-[18px] shrink-0" aria-hidden>
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="relative">Continue with GitHub</span>
            </button>
          </motion.div>

          {/* "or sign in with email" */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="-mt-4 text-center text-xs text-muted-foreground/80"
          >
            or{" "}
            <Link
              href="/auth/login"
              className="font-medium text-foreground/70 underline decoration-foreground/20 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground/40"
            >
              sign in with email
            </Link>
          </motion.p>
        </motion.div>
      </section>
      </div>{/* end first-viewport block */}

      {/* ── Services Detail Section ── */}
      <section className="relative z-10 overflow-hidden">
        {/* Section lighting */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {/* Top-center radial wash */}
          <div
            className="absolute inset-x-0 top-0 h-[420px]"
            style={{
              background:
                "radial-gradient(ellipse 60% 100% at 50% 0%, color-mix(in oklab, var(--primary) 6%, transparent) 0%, transparent 70%)",
            }}
          />
          {/* Subtle dot-grid texture */}
          <div
            className="absolute inset-0 opacity-[0.018] dark:opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-10">
          {/* Section heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-14 space-y-3 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70">
              Platform
            </p>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need, in one place
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              A growing suite of professional tools designed to work together —
              so you never have to switch contexts.
            </p>
          </motion.div>

          {/* Service cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <motion.div
                key={service.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="h-full"
              >
                <ServiceDetailCard service={service} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row sm:px-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground/70">
            <LogoMark compact />
            <span className="font-medium text-muted-foreground">WorkHub</span>
            <span className="hidden sm:inline">&middot;</span>
            <span className="hidden sm:inline">
              &copy; {new Date().getFullYear()}
            </span>
          </div>
          <div className="flex items-center gap-5 text-[13px] text-muted-foreground/70">
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-foreground">
              Terms
            </Link>
            <Link href="/cookies" className="transition-colors hover:text-foreground">
              Cookies
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}

type Service = (typeof services)[number]

function ServiceDetailCard({ service }: { service: Service }) {
  const Icon = service.icon

  const inner = (
    <div
      className={[
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300",
        service.comingSoon
          ? "border-border/30 bg-muted/10 p-7 opacity-55"
          : "cursor-pointer border-border/40 bg-card/60 p-7 backdrop-blur-sm hover:-translate-y-2 hover:shadow-2xl",
      ].join(" ")}
    >
      {!service.comingSoon && (
        <>
          {/* Top edge shine line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Persistent ambient top glow */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.3] transition-opacity duration-500 group-hover:opacity-0"
            style={{
              background: `radial-gradient(ellipse 70% 50% at 50% -5%, color-mix(in oklab, ${service.glowColor} 8%, transparent) 0%, transparent 60%)`,
            }}
          />

          {/* Hover top glow — stronger */}
          <div
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `radial-gradient(ellipse 90% 65% at 50% -5%, color-mix(in oklab, ${service.glowColor} 22%, transparent) 0%, transparent 68%)`,
            }}
          />

          {/* Inner bottom gradient wash on hover */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{
              background: `linear-gradient(to top, color-mix(in oklab, ${service.glowColor} 8%, transparent), transparent)`,
            }}
          />

          {/* Colored inset border ring on hover */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{
              boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${service.glowColor} 28%, transparent)`,
            }}
          />
        </>
      )}

      {/* Content — z-10 ensures it sits above glow layers */}
      <div className="relative z-10 flex h-full flex-col">
        {/* Icon */}
        <div
          className={[
            `mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${service.gradient} shadow-lg`,
            !service.comingSoon ? "transition-all duration-300 group-hover:scale-110" : "",
          ].join(" ")}
          style={
            !service.comingSoon
              ? { boxShadow: `0 4px 14px -2px color-mix(in oklab, ${service.glowColor} 30%, transparent)` }
              : undefined
          }
        >
          <Icon className="size-6 text-white" />
        </div>

        {/* Title + badge */}
        <div className="mb-1 flex items-center gap-3">
          <h3 className="text-xl font-semibold tracking-tight">{service.name}</h3>
          {service.comingSoon && (
            <span className="rounded-full border border-border/50 bg-muted/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
              Coming soon
            </span>
          )}
        </div>

        <p className="mb-1 text-sm font-medium text-primary">{service.tagline}</p>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{service.description}</p>

        {/* Feature list */}
        <ul className="flex-1 space-y-2">
          {service.features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-muted-foreground">
              <span className={`mt-[5px] size-1.5 shrink-0 rounded-full bg-gradient-to-br ${service.gradient}`} />
              {f}
            </li>
          ))}
        </ul>

        {/* Bottom CTA */}
        <div className="mt-6">
          {service.comingSoon ? (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground/50">
              <Lock className="size-3.5" />
              Not yet available
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground/60 transition-colors group-hover:text-foreground">
              Get started
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
            </span>
          )}
        </div>
      </div>{/* end z-10 content wrapper */}
    </div>
  )

  if (service.comingSoon || !service.href) return inner

  return (
    <Link href={service.href} className="block h-full">
      {inner}
    </Link>
  )
}
