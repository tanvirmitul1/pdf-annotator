import { SettingsView } from "@/components/settings/settings-view"
import { requireAppUser } from "@/lib/auth/require"
import { accountRepository } from "@/lib/db/repositories/account"

export default async function SettingsPage() {
  const { user, session } = await requireAppUser()
  const repository = accountRepository()
  const plan = repository.getPlanById(user.planId)
  const usageRows = repository.getUsageForUser(user.id)
  const latestExportJob = repository.getLatestExportJob(user.id)

  return (
    <SettingsView
      snapshot={{
        user: {
          displayName: user.displayName,
          email: user.email,
          providers: user.providers,
          imageUrl: user.avatarUrl ?? user.googlePhotoUrl,
          deletedAt: user.deletedAt,
        },
        currentSessionId: session.id,
        plan: {
          name: plan?.name ?? "Free",
          limits: plan?.limits ?? { documents: 0, storageMB: 0, shareLinks: 0 },
        },
        usage: usageRows.map((usage) => ({
          metric: usage.metric,
          value: usage.value,
          limit: plan?.limits[usage.metric] ?? 0,
        })),
        sessions: repository.listSessionsForUser(user.id).map((entry) => ({
          id: entry.id,
          label: entry.label,
          userAgent: entry.userAgent,
          lastActivityAt: entry.lastActivityAt,
        })),
        latestExportJob: latestExportJob
          ? {
              status: latestExportJob.status,
              progress: latestExportJob.progress,
              resultUrl: latestExportJob.resultUrl,
              updatedAt: latestExportJob.updatedAt,
            }
          : null,
      }}
    />
  )
}
