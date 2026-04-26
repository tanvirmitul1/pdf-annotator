import { Tag } from "lucide-react"

export default function TagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Tags
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tags you apply to annotations will appear here.
        </p>
      </div>

      <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-card/55 py-20 text-center">
        <div className="empty-illustration mx-auto mb-4 flex size-16 items-center justify-center rounded-[1.4rem] bg-accent/10">
          <Tag className="size-8 text-accent-foreground/50" />
        </div>
        <p className="font-heading text-lg font-semibold text-foreground">No tags yet</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
          Open a document, create an annotation, and add tags to start building your tag library.
        </p>
      </div>
    </div>
  )
}
