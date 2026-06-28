import { FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CollectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Collections
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Group documents into themes, courses, or client workspaces.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border/70 bg-card/55 py-20 text-center">
        <div className="empty-illustration mx-auto mb-4 flex size-16 items-center justify-center rounded-lg bg-primary/8">
          <FolderKanban className="size-8 text-primary/60" />
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">No collections yet</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          Create a collection to organise your documents by topic, project, or client.
        </p>
        <Button className="mt-6 rounded-full px-6" disabled>
          Create collection
        </Button>
        <p className="mt-3 text-xs text-muted-foreground/60">Coming soon</p>
      </div>
    </div>
  )
}
