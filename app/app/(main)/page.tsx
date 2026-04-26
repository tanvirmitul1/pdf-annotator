import { DocumentUpload } from "@/components/documents/upload"
import { DocumentList } from "@/components/documents/list"
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
      <div>
        <p className="text-sm text-muted-foreground">
          {getGreeting()}, {firstName}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground">
          Your Documents
        </h1>
      </div>

      <DocumentUpload />

      <DocumentList />
    </div>
  )
}
