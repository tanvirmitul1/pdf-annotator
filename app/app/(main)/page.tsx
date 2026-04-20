export default function AppDashboardPage() {
  return (
    <section className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Dashboard</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Welcome to the scaffolded app shell.</h1>
      <p className="mt-3 max-w-2xl text-sm/7 text-muted-foreground">
        Authentication, plans, entitlements, typed errors, rate limiting, and the protected layout
        are all in place. Product features land in the next phases.
      </p>
    </section>
  )
}
