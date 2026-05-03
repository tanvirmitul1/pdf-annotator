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
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}, {firstName}</p>
          <h1 className="mt-0.5 font-heading text-3xl font-bold tracking-tight text-foreground">
            Workspace
          </h1>
        </div>
        
        {/* Prominent Upload Area */}
        <div className="grid gap-6 md:grid-cols-3">
           <div className="md:col-span-2">
              <DashboardUpload variant="inline" />
           </div>
           <div className="flex flex-col justify-center gap-2 rounded-xl border border-border/40 bg-card/50 p-6 backdrop-blur-sm">
              <h3 className="font-semibold">Quick Start</h3>
              <p className="text-xs text-muted-foreground">Upload your PDF or image files to start annotating, tagging, and organizing your study materials.</p>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Recent Documents</h2>
        <DocumentList />
      </div>
    </div>
  )
}
