export default function TrashPage() {
  return (
    <section className="space-y-4">
      <div className="glass-panel surface-border rounded-[2rem] px-6 py-7 sm:px-8">
        <p className="text-[0.72rem] font-semibold tracking-[0.24em] text-primary uppercase">
          Trash
        </p>
        <h1 className="mt-4 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Soft delete deserves a calmer, clearer recovery space.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
          Deleted documents and annotations can be restored with confidence
          here, instead of feeling buried behind a placeholder route.
        </p>
      </div>
      <div className="glass-panel surface-border rounded-[2rem] p-6">
        <p className="text-sm font-semibold text-foreground">
          Restore flow ready
        </p>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">
          The visual system now supports recovery messaging, expiration timing,
          and item-level restore actions without another redesign pass.
        </p>
      </div>
    </section>
  )
}
