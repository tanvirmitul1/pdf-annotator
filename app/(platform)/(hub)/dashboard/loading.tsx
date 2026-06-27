import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden border-b border-border/30">
        <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2 rounded-full" />
                <Skeleton className="size-3.5 w-3.5 rounded" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-9 w-72" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-9 w-34 rounded-md" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-6 sm:px-8 lg:px-12 py-8 space-y-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/30 bg-card/70 p-5">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="size-11 rounded-xl" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-9 w-14 mb-1" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5 w-full mt-3 rounded-full" />
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart */}
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3.5 w-56" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>
              <div className="flex items-end gap-2 h-24">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <Skeleton
                      className="w-full rounded-lg"
                      style={{ height: `${32 + Math.random() * 48}px` }}
                    />
                    <Skeleton className="h-2.5 w-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <div className="mb-4 space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3.5 w-44" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/30 bg-card/70 p-7">
                    <Skeleton className="size-14 rounded-2xl mb-5" />
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Donut */}
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="h-5 w-36 mb-4" />
              <div className="flex justify-center mb-5">
                <Skeleton className="size-32 rounded-full" />
              </div>
              <div className="space-y-3">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="size-3 rounded-sm" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-1 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Launch */}
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="h-5 w-28 mb-3" />
              <div className="space-y-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="size-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="size-4 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Spotlight */}
            <div className="rounded-2xl border border-border/30 bg-card/70 p-6">
              <Skeleton className="size-10 rounded-xl mb-3" />
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-3.5 w-full mb-1" />
              <Skeleton className="h-3.5 w-full mb-1" />
              <Skeleton className="h-3.5 w-2/3 mb-3" />
              <Skeleton className="h-7 w-24 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
