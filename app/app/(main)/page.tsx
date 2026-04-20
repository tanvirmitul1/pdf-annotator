import { DashboardEmptyState } from "@/components/app/dashboard-empty-state"

export default function AppDashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Your study library</h1>
      </div>
      <DashboardEmptyState />
    </section>
  )
}
