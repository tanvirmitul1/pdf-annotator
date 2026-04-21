import { DocumentUpload } from "@/components/documents/upload"
import { DocumentList } from "@/components/documents/list"

export default function AppDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Your Documents
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload and manage your PDF and image documents.
        </p>
      </div>

      <DocumentUpload />

      <DocumentList />
    </div>
  )
}
