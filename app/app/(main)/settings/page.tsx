export default function SettingsPlaceholderPage() {
  return (
    <section className="space-y-4">
      <div className="glass-panel surface-border rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
          Settings
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Account controls now have a more credible home.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
          This phase keeps the settings logic intentionally light, but the route
          now feels like part of a polished product instead of a leftover
          scaffold.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">
            Profile and identity
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            User profile, theme, connected sign-in methods, and account-level
            controls belong here once the full settings flows are expanded.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">
            Plan and usage
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Free-plan context, quotas, and upgrade messaging can now sit in a
            layout with enough visual structure to feel premium.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Security</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Session revocation, password changes, and linked providers are
            easier to understand when grouped inside calmer, higher-contrast
            surfaces.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">
            Data lifecycle
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Export, deletion grace, restore, and consent controls can expand
            here next without another layout rewrite.
          </p>
        </article>
      </div>
    </section>
  )
}
