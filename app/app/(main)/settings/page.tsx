export default function SettingsPlaceholderPage() {
  return (
    <section className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Settings</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">Settings placeholder</h1>
      <p className="mt-3 max-w-2xl text-sm/7 text-muted-foreground">
        This page is intentionally minimal in Phase 1. Phase 1.5 expands it with profile, usage,
        security, export, and account deletion flows.
      </p>
    </section>
  )
}
