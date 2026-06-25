import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Profile Section */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-20" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Plan Section */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-border/60 bg-card p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-72" />
        </div>
      </div>
    </div>
  )
}
