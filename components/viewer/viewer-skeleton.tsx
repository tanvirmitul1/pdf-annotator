export function ViewerSkeleton() {
  return (
    <div className="flex h-full flex-col">
      {/* Toolbar skeleton */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
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

      {/* Body skeleton */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
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

        {/* Page area skeleton */}
        <div className="flex flex-1 flex-col items-center gap-4 overflow-hidden bg-muted/30 p-6">
          <div className="h-[800px] w-[600px] max-w-full animate-pulse rounded bg-muted shadow-lg" />
        </div>
      </div>
    </div>
  )
}
