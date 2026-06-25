"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText,
  MessageSquare,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
}

interface DashboardContentProps {
  firstName: string
  greeting: string
  documentCount: number
  chatCount: number
  children: React.ReactNode
}

export function DashboardContent({
  firstName,
  greeting,
  documentCount,
  chatCount,
  children,
}: DashboardContentProps) {
  const today = new Date()
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b border-border/30">
        {/* Rich mesh gradient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/6 via-transparent to-accent/4" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_70%_-10%,color-mix(in_oklab,var(--primary)_10%,transparent)_0,transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,color-mix(in_oklab,var(--accent)_6%,transparent)_0,transparent_40%)]" />
        </div>

        <div className="relative mx-auto max-w-360 py-10 px-6 sm:px-8 lg:px-12">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-3.5" />
                <span>{dateStr}</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {greeting}, {firstName}
              </h1>
              <p className="text-base text-muted-foreground max-w-lg">
                Pick up where you left off or start something new
              </p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className="flex items-center gap-2.5">
              <Button asChild variant="outline" size="sm" className="border-border/50 h-9 gap-1.5">
                <Link href="/services/documents">
                  <Plus className="size-3.5" />
                  New Document
                </Link>
              </Button>
              <Button asChild size="sm" className="h-9 gap-1.5">
                <Link href="/services/ai-chat">
                  <Sparkles className="size-3.5" />
                  Start Chat
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats + Overview Row */}
      <div className="mx-auto max-w-360 px-6 sm:px-8 lg:px-12">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8"
        >
          {/* Documents stat */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Link href="/services/documents" className="group block">
              <div className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm p-5 transition-all duration-200 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-sm shadow-blue-500/20">
                    <FileText className="size-5 text-white" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/50 transition-all group-hover:text-blue-500 group-hover:translate-x-0.5" />
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {documentCount}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Documents</p>
              </div>
            </Link>
          </motion.div>

          {/* Conversations stat */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
          >
            <Link href="/services/ai-chat" className="group block">
              <div className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm p-5 transition-all duration-200 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-sm shadow-purple-500/20">
                    <MessageSquare className="size-5 text-white" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground/50 transition-all group-hover:text-purple-500 group-hover:translate-x-0.5" />
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
                  {chatCount}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Conversations</p>
              </div>
            </Link>
          </motion.div>

          {/* Activity summary */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-border/30 bg-card/70 backdrop-blur-sm p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/20">
                <TrendingUp className="size-5 text-white" />
              </div>
            </div>
            <p className="text-3xl font-bold font-mono tracking-tight text-foreground">
              {documentCount + chatCount}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">Total items</p>
          </motion.div>

          {/* More coming */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-dashed border-border/40 bg-muted/20 p-5 flex flex-col items-center justify-center text-center"
          >
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted/60 mb-3">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">More services</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Coming soon</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Services Section */}
      <div className="mx-auto max-w-360 pb-16 px-6 sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground tracking-tight">Your Services</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Open a service to get started</p>
            </div>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}
