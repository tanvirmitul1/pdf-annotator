import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { UpdateProfileForm } from "@/components/settings/update-profile-form"

export const metadata = { title: "Profile – Clustar" }

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true, name: true, email: true, passwordHash: true, createdAt: true },
  })

  const initials = (dbUser?.name ?? dbUser?.email ?? "U")
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left — main form (spans 2 cols on lg) */}
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground mb-1">Personal information</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Update your name, password, and manage your account details.
          </p>
          <UpdateProfileForm
            name={dbUser?.name ?? null}
            email={dbUser?.email ?? null}
            emailVerified={Boolean(dbUser?.emailVerified)}
            initials={initials}
            hasPassword={Boolean(dbUser?.passwordHash)}
          />
        </div>
      </div>

      {/* Right — account details + danger zone */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-border/30 bg-card/80 p-6">
          <h2 className="text-base font-semibold text-foreground mb-4">Account details</h2>
          <dl className="space-y-4">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Account ID
              </dt>
              <dd className="text-sm font-mono text-foreground/70 break-all">{user.id}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Role
              </dt>
              <dd className="text-sm text-foreground capitalize">{user.role?.toLowerCase() ?? "user"}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60">
                Member since
              </dt>
              <dd className="text-sm text-foreground">
                {new Date(dbUser?.createdAt ?? Date.now()).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h2 className="text-base font-semibold text-foreground mb-1">Danger zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <button
            disabled
            className="inline-flex h-9 items-center justify-center rounded-xl border border-destructive/40 bg-transparent px-4 text-sm font-medium text-destructive opacity-50 cursor-not-allowed"
          >
            Delete account
          </button>
          <p className="text-xs text-muted-foreground mt-2">
            Contact support to request account deletion.
          </p>
        </div>
      </div>
    </div>
  )
}
