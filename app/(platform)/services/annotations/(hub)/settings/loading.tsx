import { Skeleton } from "@/components/ui/skeleton"

export default function DocumentSettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-28 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border/30 bg-card/70 p-6 space-y-4">
        <Skeleton className="h-3 w-16" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-44" />
          </div>
        </div>
        <Skeleton className="h-3 w-80" />
      </div>

      {/* Appearance */}
      <div className="rounded-xl border border-border/30 bg-card/70 p-6 space-y-4">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Plan */}
      <div className="rounded-xl border border-border/30 bg-card/70 p-6 space-y-4">
        <Skeleton className="h-3 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
        </div>
        <Skeleton className="h-[1px] w-full" />
        <Skeleton className="h-3 w-72" />
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-border/30 bg-card/70 p-6 space-y-4">
        <Skeleton className="h-3 w-24" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
      </div>
    </div>
  )
}
