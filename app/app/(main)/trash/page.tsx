import { DocumentList } from "@/components/documents/list"

export default function TrashPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Trash
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Deleted documents can be restored or permanently removed here.
        </p>
      </div>

      <DocumentList showDeleted />
    </div>
  )
}
