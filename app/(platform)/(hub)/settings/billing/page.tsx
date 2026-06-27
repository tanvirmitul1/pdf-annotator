import { redirect } from "next/navigation"
import { Check, Zap, CreditCard, ArrowRight, BarChart3 } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

export const metadata = { title: "Billing – Clustar" }

const PRO_FEATURES = [
  "Unlimited documents",
  "Priority AI responses",
  "Advanced annotation tools",
  "Team collaboration",
  "Export to PDF & Word",
  "Priority support",
]

const FREE_FEATURES = [
  "Up to 10 documents",
  "Standard AI chat",
  "Basic annotation tools",
  "Community support",
]

export default async function BillingPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      planId: true,
      subscriptionStatus: true,
      createdAt: true,
      usage: { select: { metric: true, value: true } },
    },
  })

  const planId = dbUser?.planId ?? "free"
  const isFreePlan = planId === "free"
  const docUsage = dbUser?.usage.find((u) => u.metric === "DOCUMENTS")?.value ?? 0

  return (
    <div className="space-y-6">
      {/* Top row — current plan + usage stats side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan card */}
        <div className="lg:col-span-2 rounded-2xl border border-border/30 bg-card/80 p-6 sm:p-8">
          <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Current plan</h2>
              <p className="text-sm text-muted-foreground">
                You are on the{" "}
                <span className="font-medium text-foreground capitalize">{planId}</span> plan.
              </p>
            </div>
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
                isFreePlan
                  ? "bg-muted/60 text-muted-foreground"
                  : "bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
              }`}
            >
              {!isFreePlan && <Zap className="size-3.5" />}
              <span className="capitalize">{planId}</span>
            </div>
          </div>

          {/* Usage bars */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Documents</span>
                <span className="font-medium text-foreground tabular-nums">
                  {docUsage} / {isFreePlan ? "10" : "∞"}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{ width: `${Math.min((docUsage / 10) * 100, 100)}%` }}
                />
              </div>
              {isFreePlan && docUsage >= 8 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Approaching limit — upgrade to Pro for unlimited documents.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Usage summary stat cards */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 shadow-sm">
                <BarChart3 className="size-4 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Documents used</span>
            </div>
            <p className="text-3xl font-bold font-mono text-foreground tabular-nums">{docUsage}</p>
            <p className="text-xs text-muted-foreground mt-1">
              of {isFreePlan ? "10" : "unlimited"} on {planId} plan
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card/80 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-sm">
                <Zap className="size-4 text-white" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Plan status</span>
            </div>
            <p className="text-lg font-semibold text-foreground capitalize">
              {dbUser?.subscriptionStatus?.toLowerCase().replace("_", " ") ?? "free"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">No renewal required</p>
          </div>
        </div>
      </div>

      {/* Plan comparison — full 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Free */}
        <div
          className={`relative rounded-2xl border p-6 ${
            isFreePlan ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card/80"
          }`}
        >
          {isFreePlan && (
            <div className="absolute -top-3 left-5">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-2.5 py-1 rounded-full">
                Current plan
              </span>
            </div>
          )}
          <div className="mb-5">
            <h3 className="text-base font-semibold text-foreground">Free</h3>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
          </div>
          <ul className="space-y-2.5 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Check className="size-4 text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {!isFreePlan && (
            <button
              disabled
              className="w-full h-9 rounded-xl border border-border/50 text-sm text-muted-foreground opacity-50 cursor-not-allowed"
            >
              Downgrade
            </button>
          )}
        </div>

        {/* Pro */}
        <div
          className={`relative rounded-2xl border p-6 overflow-hidden ${
            !isFreePlan ? "border-primary/40 bg-primary/5" : "border-border/30 bg-card/80"
          }`}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/6 to-violet-500/6 pointer-events-none" />
          {!isFreePlan && (
            <div className="absolute -top-3 left-5">
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                Current plan
              </span>
            </div>
          )}
          <div className="relative mb-5">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">Pro</h3>
              <span className="rounded-full bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 border border-indigo-500/20">
                RECOMMENDED
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-foreground">$12</span>
              <span className="text-sm text-muted-foreground">/month</span>
            </div>
          </div>
          <ul className="relative space-y-2.5 mb-6">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Check className="size-4 text-indigo-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {isFreePlan && (
            <button
              disabled
              className="relative w-full h-9 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-sm font-semibold text-white opacity-60 cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
            >
              <Zap className="size-4" />
              Upgrade to Pro
              <ArrowRight className="size-4" />
            </button>
          )}
          <p className="relative text-center text-xs text-muted-foreground mt-2">
            Stripe payments coming soon
          </p>
        </div>
      </div>

      {/* Bottom row — payment method + invoice history */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold text-foreground">Payment method</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            No payment method on file. Stripe integration coming soon.
          </p>
          <button
            disabled
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border/50 bg-transparent px-4 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
          >
            Add payment method
          </button>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/80 p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Billing history</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Your invoices and payment history will appear here.
          </p>
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground/50 italic">
            No invoices yet
          </div>
        </div>
      </div>
    </div>
  )
}
