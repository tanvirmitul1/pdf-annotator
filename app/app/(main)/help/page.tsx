export default function HelpPage() {
  return (
    <section className="space-y-4">
      <div className="glass-panel surface-border rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
          Help
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Support and product guidance now feel like part of the actual app.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          Legal pages, settings, keyboard shortcuts, and viewer guidance now all
          have a stronger presentation layer.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Shortcuts</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Use <strong>?</strong> inside the viewer to open the keyboard
            reference.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Privacy</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Review the legal pages for cookies, retention, user rights, and
            Google OAuth usage.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Workspace</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The redesigned shell is responsive on mobile, tablet, and desktop by
            default.
          </p>
        </article>
      </div>
    </section>
  )
}
