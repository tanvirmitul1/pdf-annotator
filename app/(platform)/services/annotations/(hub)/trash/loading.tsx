import { Skeleton } from "@/components/ui/skeleton"

export default function TrashLoading() {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Document List */}
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
  )
}
