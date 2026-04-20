export default function CookiesPage() {
  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-[2rem] border border-border bg-card/80 p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">Cookie Policy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Cookie Policy</h1>
        <div className="mt-8 space-y-8 text-sm/7 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Essential cookies</h2>
            <p className="mt-2">
              We use essential cookies to keep sessions alive, preserve theme preference, and protect
              your authenticated routes.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Analytics cookies</h2>
            <p className="mt-2">
              Analytics stays disabled until you accept it. Rejecting analytics records your preference
              and keeps the app in essential-only mode.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Managing your choice</h2>
            <p className="mt-2">
              You can revisit your preference by clearing site cookies or using the banner again on a
              fresh session. TODO: Lawyer review.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
