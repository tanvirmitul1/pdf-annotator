import { DocumentUpload } from "@/components/documents/upload"
import { DocumentList } from "@/components/documents/list"
import { requireAppUser } from "@/lib/auth/require"
import { Badge } from "@/components/ui/badge"

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
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5">
        <div className="rounded-[1.25rem] border border-border/60 bg-card/75 p-6 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {getGreeting()}, {firstName}
              </p>
              <h1 className="mt-1 font-heading text-3xl font-semibold tracking-tight text-foreground">
                Your document workspace
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
                Upload files, reopen active work, and keep collaboration moving
                without digging through a crowded dashboard.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary"
            >
              Workspace ready
            </Badge>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-border/60 bg-card/70 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.4)] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
                Library
              </p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">
                Recent documents
              </h2>
            </div>
          </div>

          <DocumentList />
        </div>
      </section>

      <aside className="space-y-5">
        <div className="rounded-[1.25rem] border border-border/60 bg-card/78 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            New upload
          </p>
          <h2 className="mt-1 text-xl font-semibold text-foreground">
            Start something new
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Drop in a PDF or image and jump straight into review, markup, and
            collaboration.
          </p>

          <div className="mt-4">
            <DocumentUpload />
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-border/60 bg-card/68 p-5 backdrop-blur-xl">
          <p className="text-[11px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
            Tips
          </p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div className="rounded-xl border border-border/50 bg-background/45 p-3">
              Share documents from the viewer to bring teammates into comments,
              replies, and annotation review.
            </div>
            <div className="rounded-xl border border-border/50 bg-background/45 p-3">
              Reopen recent work from the library and the viewer will keep your
              last reading position synced.
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}
