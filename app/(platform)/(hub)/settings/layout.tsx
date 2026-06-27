import { redirect } from "next/navigation"

import { getCurrentUser } from "@/lib/auth/require"
import { SettingsTabNav } from "@/components/settings/settings-tab-nav"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/auth/login")

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Page header + tab nav */}
      <div className="border-b border-border/30 bg-card/40">
        <div className="px-6 sm:px-8 lg:px-12 pt-8 pb-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Account Settings</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Manage your profile, security, and subscription
          </p>
          <SettingsTabNav />
        </div>
      </div>

      {/* Tab content */}
      <div className="px-6 sm:px-8 lg:px-12 py-8">
        {children}
      </div>
    </div>
  )
}
