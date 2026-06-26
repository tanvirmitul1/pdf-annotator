import { redirect } from "next/navigation"
import { ShieldCheck, User } from "lucide-react"

import { getCurrentUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { SetPasswordForm } from "@/components/settings/set-password-form"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true, emailVerified: true, email: true, name: true },
  })

  const hasPassword = Boolean(dbUser?.passwordHash)

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Settings</h1>
      <p className="mb-8 text-muted-foreground">Manage your account and preferences.</p>

      <div className="space-y-6">
        {/* Profile */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="size-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Profile</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Name</p>
              <p className="text-base font-medium">{user.name ?? "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-muted-foreground">Email</p>
              <div className="flex items-center gap-2">
                <p className="text-base font-medium">{user.email ?? "—"}</p>
                {dbUser?.emailVerified ? (
                  <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    Verified
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    Unverified
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Password */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <div className="mb-1 flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              {hasPassword ? "Change password" : "Set a password"}
            </h2>
          </div>
          <p className="mb-6 text-sm text-muted-foreground">
            {hasPassword
              ? "Update the password used to sign in with your email."
              : "Add a password to your account so you can also sign in with email and password — in addition to Google or GitHub."}
          </p>
          <SetPasswordForm hasPassword={hasPassword} />
        </section>

        {/* Service Access */}
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="mb-2 text-xl font-semibold">Service Access</h2>
          <p className="text-sm text-muted-foreground">
            Manage your access to different services across the platform.
          </p>
        </section>
      </div>
    </div>
  )
}
