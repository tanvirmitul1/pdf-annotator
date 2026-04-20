import { DocumentUpload } from "@/components/documents/upload"
import { DocumentList } from "@/components/documents/list"

export default function AppDashboardPage() {
  return (
    <section className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Dashboard</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Your Documents</h1>
        <p className="mt-3 max-w-2xl text-sm/7 text-muted-foreground">
          Upload and manage your PDF and image documents with annotations.
        </p>
      </div>

      <DocumentUpload />

      <DocumentList />
    </section>
  )
}
