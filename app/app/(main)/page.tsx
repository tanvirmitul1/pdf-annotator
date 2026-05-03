import { DocumentList } from "@/components/documents/list"
import { DashboardUpload } from "@/components/documents/dashboard-upload"
import { requireAppUser } from "@/lib/auth/require"


function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default async function AppDashboardPage() {
  const session = await requireAppUser()
  const firstName = session.user.name?.split(" ")[0] ?? "there"

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}, {firstName}</p>
          <h1 className="mt-0.5 font-heading text-2xl font-semibold tracking-tight text-foreground">
            Documents
          </h1>
        </div>
        <DashboardUpload />

      </div>

      {/* Document list */}
      <DocumentList />
    </div>
  )
}
