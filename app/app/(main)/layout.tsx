import { AppShell } from "@/components/app/shell"
import { GraceBanner } from "@/components/app/grace-banner"
import { requireAppUser } from "@/lib/auth/require"
import { getDeletionDaysRemaining } from "@/features/settings/service"

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAppUser()
  const imageUrl = user.avatarUrl ?? user.googlePhotoUrl

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        email: user.email,
        imageUrl,
      }}
    >
      <div id="main-content" className="space-y-6">
        {user.deletedAt ? <GraceBanner daysRemaining={getDeletionDaysRemaining(user.deletedAt)} /> : null}
        {children}
      </div>
    </AppShell>
  )
}
