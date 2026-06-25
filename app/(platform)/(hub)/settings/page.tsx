import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/require"

export default async function SettingsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences.</p>

      <div className="space-y-6">
        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Name</p>
              <p className="text-base font-medium">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="text-base font-medium">{user.email}</p>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-border/60 bg-card p-6">
          <h2 className="text-xl font-semibold mb-2">Service Access</h2>
          <p className="text-sm text-muted-foreground">
            Manage your access to different services across the platform.
          </p>
        </section>
      </div>
    </div>
  )
}
