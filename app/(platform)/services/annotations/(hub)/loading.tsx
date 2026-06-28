import { Skeleton } from "@/components/ui/skeleton"

export default function DocumentsLoading() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-6">
        <div>
          <Skeleton className="h-4 w-36 mb-1" />
          <Skeleton className="h-8 w-56" />
        </div>

        {/* Upload Area + Quick Start */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <div className="rounded-xl border border-border/40 bg-card/50 p-6 space-y-3">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      </div>

      {/* Recent Documents */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg border border-border/30 bg-card/50 p-4"
            >
              <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-3 w-20 hidden sm:block" />
              <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
