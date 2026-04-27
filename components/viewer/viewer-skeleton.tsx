export function ViewerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-border/70 bg-card/75 px-3 backdrop-blur-xl">
        <div className="h-7 w-24 animate-pulse rounded bg-muted" />
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="h-7 w-7 animate-pulse rounded bg-muted" />
        <div className="h-7 w-7 animate-pulse rounded bg-muted" />
        <div className="mx-1 h-5 w-px bg-border" />
        <div className="h-7 w-20 animate-pulse rounded bg-muted" />
        <div className="ml-auto flex gap-2">
          <div className="h-7 w-7 animate-pulse rounded bg-muted" />
          <div className="h-7 w-7 animate-pulse rounded bg-muted" />
          <div className="h-7 w-7 animate-pulse rounded bg-muted" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-card/75 md:flex">
          <div className="flex border-b border-border">
            {["", "", ""].map((_, i) => (
              <div key={i} className="h-9 flex-1 animate-pulse bg-muted/50" />
            ))}
          </div>
          <div className="flex flex-col gap-2 p-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 w-full animate-pulse rounded bg-muted"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-4 overflow-hidden bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_96%,white)_0%,color-mix(in_oklab,var(--muted)_65%,transparent)_100%)] p-6">
          <div className="h-[800px] w-[600px] max-w-full animate-pulse rounded-lg bg-muted shadow-lg" />
        </div>
      </div>
    </div>
  )
}
