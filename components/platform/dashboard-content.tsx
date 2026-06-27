"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  FileText,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  TrendingUp,
  Activity,
  Zap,
  Layers,
  Bot,
  ChevronRight,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
}

interface DashboardContentProps {
  firstName: string
  greeting: string
  documentCount: number
  chatCount: number
  children: React.ReactNode
}

function DonutChart({ docs, chats }: { docs: number; chats: number }) {
  const total = docs + chats || 1
  const r = 46
  const cx = 64
  const cy = 64
  const circumference = 2 * Math.PI * r
  const docsSlice = (docs / total) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
        <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-muted/20" strokeWidth="13" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#donutPurple)" strokeWidth="13"
          strokeDasharray={circumference}
          strokeLinecap="butt"
        />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#donutBlue)" strokeWidth="13"
          strokeDasharray={`${docsSlice} ${circumference}`}
          strokeLinecap="butt"
        />
        <defs>
          <linearGradient id="donutBlue" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="donutPurple" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
        <span className="text-2xl font-bold font-mono text-foreground">{docs + chats}</span>
        <span className="text-[10px] text-muted-foreground">total</span>
      </div>
    </div>
  )
}

function ActivityBars({ docs, chats }: { docs: number; chats: number }) {
  const weights = [0.07, 0.10, 0.13, 0.16, 0.19, 0.20, 0.15]
  const docBars = weights.map((w) => Math.max(Math.round(w * docs), 0))
  const chatBars = weights.map((w) => Math.max(Math.round(w * chats), 0))
  const maxH = Math.max(...docBars.map((d, i) => d + chatBars[i]), 1)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const H = 80

  return (
    <div className="flex items-end gap-2 h-24 w-full">
      {docBars.map((dv, i) => {
        const cv = chatBars[i]
        const totalVal = dv + cv
        const totalH = (totalVal / maxH) * H
        const docH = totalVal > 0 ? (dv / totalVal) * totalH : 0
        const chatH = totalH - docH
        const isToday = i === new Date().getDay() - 1 || (new Date().getDay() === 0 && i === 6)

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex flex-col justify-end" style={{ height: `${H}px` }}>
              <div
                className="w-full flex flex-col rounded-lg overflow-hidden transition-all duration-500"
                style={{ height: `${Math.max(totalH, 4)}px` }}
              >
                {chatH > 0 && (
                  <div
                    className="w-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-85"
                    style={{ height: `${chatH}px` }}
                  />
                )}
                {docH > 0 && (
                  <div
                    className="w-full bg-gradient-to-b from-blue-500 to-cyan-500"
                    style={{ height: `${docH}px` }}
                  />
                )}
                {totalVal === 0 && (
                  <div className="w-full rounded-lg bg-muted/30" style={{ height: "4px" }} />
                )}
              </div>
            </div>
            <span
              className={`text-[9px] font-medium transition-colors ${
                isToday ? "text-primary" : "text-muted-foreground/40"
              }`}
            >
              {days[i]}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function DashboardContent({
  firstName,
  greeting,
  documentCount,
  chatCount,
  children,
}: DashboardContentProps) {
  const [dateStr, setDateStr] = useState("")

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    )
  }, [])

  const total = documentCount + chatCount
  const docsPercent = total > 0 ? Math.round((documentCount / total) * 100) : 50
  const chatsPercent = 100 - docsPercent

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* ── Welcome Banner ──────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/8 via-transparent to-violet-500/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_80%_-20%,color-mix(in_oklab,var(--primary)_12%,transparent)_0,transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>
        <div className="relative mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <motion.div variants={fadeUp} className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
                </span>
                <Clock className="size-3.5" />
                <span>{dateStr}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {greeting},{" "}
                <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  {firstName}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Here&apos;s what&apos;s happening with your workspace today
              </p>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-center gap-2.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 border-border/50 hover:border-primary/40"
              >
                <Link href="/services/documents">
                  <Plus className="size-3.5" />
                  New Document
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="h-9 gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 border-0"
              >
                <Link href="/services/ai-chat">
                  <Sparkles className="size-3.5" />
                  AI Chat
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* ── KPI Stats Row ────────────────────────────────────────────────── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Documents */}
          <motion.div variants={fadeUp}>
            <Link href="/services/documents" className="group block h-full">
              <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-5 h-full overflow-hidden transition-all duration-300 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/8 hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30">
                      <FileText className="size-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                      <TrendingUp className="size-3" />
                      <span>Active</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    {documentCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">Documents</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Open library</span>
                    <ArrowRight className="size-3" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Conversations */}
          <motion.div variants={fadeUp}>
            <Link href="/services/ai-chat" className="group block h-full">
              <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-5 h-full overflow-hidden transition-all duration-300 hover:border-purple-500/40 hover:shadow-xl hover:shadow-purple-500/8 hover:-translate-y-0.5">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/30">
                      <Bot className="size-5 text-white" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                      <Activity className="size-3" />
                      <span>AI Ready</span>
                    </div>
                  </div>
                  <p className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                    {chatCount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">Conversations</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-purple-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>Start chatting</span>
                    <ArrowRight className="size-3" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Total Activity */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-5 h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30">
                    <Zap className="size-5 text-white" />
                  </div>
                  <Badge className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0 rounded-full">
                    All time
                  </Badge>
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                  {total}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Total Activity</p>
                <div className="mt-3">
                  <Progress
                    value={Math.min((total / 50) * 100, 100)}
                    className="h-1.5 bg-muted/30 [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-teal-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div variants={fadeUp}>
            <div className="relative rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-5 h-full overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                    <Layers className="size-5 text-white" />
                  </div>
                  <Badge className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 rounded-full">
                    Beta
                  </Badge>
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight text-foreground tabular-nums">
                  2
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">Services Active</p>
                <p className="mt-3 text-xs text-muted-foreground/50">More launching soon</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* ── Main 3-col Grid ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — chart + services (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-semibold text-foreground">Activity Overview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Weekly usage across all services
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="size-2.5 rounded-sm bg-gradient-to-br from-blue-500 to-cyan-500" />
                    <span>Documents</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="size-2.5 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500" />
                    <span>AI Chats</span>
                  </div>
                </div>
              </div>
              <ActivityBars docs={documentCount} chats={chatCount} />
            </motion.div>

            {/* Services Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-foreground">Your Services</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Launch any tool instantly
                  </p>
                </div>
              </div>
              {children}
            </motion.div>
          </div>

          {/* Right sidebar (1/3) */}
          <div className="space-y-5">
            {/* Usage Breakdown Donut */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-6"
            >
              <h3 className="font-semibold text-foreground mb-4">Usage Breakdown</h3>
              <div className="flex items-center justify-center mb-5">
                <DonutChart docs={documentCount} chats={chatCount} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-sm bg-gradient-to-br from-blue-500 to-cyan-500 shrink-0" />
                    <span className="text-muted-foreground">Documents</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground tabular-nums">
                      {documentCount}
                    </span>
                    <span className="text-xs text-muted-foreground/50 w-8 text-right">
                      {docsPercent}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={docsPercent}
                  className="h-1 bg-muted/30 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-cyan-500"
                />
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-3 rounded-sm bg-gradient-to-br from-purple-500 to-pink-500 shrink-0" />
                    <span className="text-muted-foreground">AI Chats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-semibold text-foreground tabular-nums">
                      {chatCount}
                    </span>
                    <span className="text-xs text-muted-foreground/50 w-8 text-right">
                      {chatsPercent}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={chatsPercent}
                  className="h-1 bg-muted/30 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
                />
              </div>
            </motion.div>

            {/* Quick Launch */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="rounded-2xl border border-border/30 bg-card/80 backdrop-blur-sm p-6"
            >
              <h3 className="font-semibold text-foreground mb-3">Quick Launch</h3>
              <div className="space-y-1">
                <Link
                  href="/services/documents"
                  className="group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors shrink-0">
                    <FileText className="size-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Document Annotator</p>
                    <p className="text-xs text-muted-foreground truncate">Upload &amp; annotate PDFs</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>

                <Link
                  href="/services/ai-chat"
                  className="group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors shrink-0">
                    <Bot className="size-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">AI Chat Assistant</p>
                    <p className="text-xs text-muted-foreground truncate">Intelligent conversations</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>

                <Link
                  href="/settings"
                  className="group flex items-center gap-3 rounded-xl p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors shrink-0">
                    <Star className="size-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">Settings</p>
                    <p className="text-xs text-muted-foreground truncate">Account &amp; preferences</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                </Link>
              </div>
            </motion.div>

            {/* Feature Spotlight */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              className="relative rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-violet-500/6 to-transparent p-6 overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.12),transparent)] pointer-events-none" />
              <div className="relative">
                <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30 mb-3">
                  <Sparkles className="size-5 text-white" />
                </div>
                <h3 className="font-semibold text-foreground text-sm">Pro Tip</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Use the AI Chat assistant to analyze your PDF documents with multimodal
                  understanding — upload images, ask questions, get instant insights.
                </p>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  className="mt-3 h-7 text-xs border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50 hover:text-indigo-500"
                >
                  <Link href="/services/ai-chat">
                    Try it now
                    <ArrowRight className="size-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
