export default function CollectionsPage() {
  return (
    <section className="space-y-4">
      <div className="glass-panel surface-border rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
          Collections
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Group documents into themes, courses, or client workspaces.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          This route now has a polished shell ready for collection management
          instead of returning a blank screen.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="glass-panel surface-border rounded-[2rem] p-6 lg:col-span-2">
          <p className="text-sm font-semibold text-foreground">
            Ready for collection cards, counters, and move actions
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Documents, filters, and move-to-collection flows can slot into this
            layout with responsive spacing already solved.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Next upgrade</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Add saved collection views, drag-and-drop sorting, and quick actions
            from the library.
          </p>
        </article>
      </div>
    </section>
  )
}
