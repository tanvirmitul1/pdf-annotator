import { DocumentList } from "@/components/documents/list"

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Trash
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Restore or permanently remove deleted documents.
        </p>
      </div>

      <DocumentList showDeleted />
    </div>
  )
}
