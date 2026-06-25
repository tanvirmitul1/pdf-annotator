import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {/* Welcome Banner Skeleton */}
      <div className="relative overflow-hidden border-b border-border/20">
        <div className="mx-auto max-w-360 py-10 px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-9 w-72 sm:h-10" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row Skeleton */}
      <div className="mx-auto max-w-360 px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/30 bg-card/70 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                {i < 2 && <Skeleton className="h-4 w-4 rounded" />}
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>

      {/* Services Section Skeleton */}
      <div className="mx-auto max-w-360 pb-16 px-6 sm:px-8 lg:px-12">
        <div className="mb-6">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/30 bg-card/70 p-7 sm:p-8"
            >
              <div className="flex items-start justify-between mb-5">
                <Skeleton className="h-14 w-14 rounded-2xl" />
              </div>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-5 pt-5 border-t border-border/30">
                <div className="flex items-baseline gap-2">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
