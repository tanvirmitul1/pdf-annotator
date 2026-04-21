export default function TagsPage() {
  return (
    <section className="space-y-4">
      <div className="glass-panel surface-border rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
          Tags
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Build a tag system that stays readable even as notes scale up.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          This space is now prepared for tag lists, usage counts, color systems,
          and smart review workflows.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">Tag taxonomy</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Organize by topic, class, priority, or research stream without
            losing visual clarity.
          </p>
        </article>
        <article className="glass-panel surface-border rounded-[2rem] p-6">
          <p className="text-sm font-semibold text-foreground">
            Annotation review
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            The same shell can support tag filters, search, and spaced review
            surfaces when those features land.
          </p>
        </article>
      </div>
    </section>
  )
}
