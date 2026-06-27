import { redirect } from "next/navigation"
import { ShieldCheck, Globe } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { SetPasswordForm } from "@/components/settings/set-password-form"

export const metadata = { title: "Security – Clustar" }

export default async function SecurityPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      passwordHash: true,
      emailVerified: true,
      accounts: { select: { provider: true } },
    },
  })

  const hasPassword = Boolean(dbUser?.passwordHash)
  const providers = dbUser?.accounts.map((a) => a.provider) ?? []

  const providerInfo: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    google: { label: "Google", icon: Globe, color: "text-red-500" },
    github: { label: "GitHub", icon: Globe, color: "text-foreground" },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left — password form (main content, 2 cols) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              {hasPassword ? "Change password" : "Set a password"}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            {hasPassword
              ? "Update the password used to sign in with your email."
              : "Add a password so you can sign in with email in addition to your connected accounts."}
          </p>
          <SetPasswordForm hasPassword={hasPassword} />
        </div>

        {/* Sessions */}
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-1">Active sessions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Session management is coming soon. You can sign out from all devices below.
          </p>
          <button
            disabled
            className="inline-flex h-9 items-center justify-center rounded-xl border border-border/50 bg-transparent px-4 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
          >
            Sign out all other sessions
          </button>
        </div>
      </div>

      {/* Right — connected accounts */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Connected accounts</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Sign-in providers linked to your account.
          </p>
          {providers.length > 0 ? (
            <div className="space-y-3">
              {providers.map((provider) => {
                const info = providerInfo[provider]
                if (!info) return null
                const Icon = info.icon
                return (
                  <div
                    key={provider}
                    className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/20 px-4 py-3"
                  >
                    <Icon className={`size-5 shrink-0 ${info.color}`} />
                    <span className="text-sm font-medium text-foreground flex-1">{info.label}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      Connected
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/60 italic">No OAuth providers connected.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/80 p-6">
          <h2 className="text-base font-semibold text-foreground mb-2">Two-factor auth</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Add an extra layer of security to your account.
          </p>
          <div className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-2">
            <span className="size-2 rounded-full bg-muted-foreground/30" />
            <span className="text-xs text-muted-foreground">Coming soon</span>
          </div>
        </div>
      </div>
    </div>
  )
}
