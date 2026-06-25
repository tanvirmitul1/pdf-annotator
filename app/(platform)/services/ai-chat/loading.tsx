import { Skeleton } from "@/components/ui/skeleton"

export default function AIChatLoading() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Skeleton — hidden on mobile */}
      <div className="hidden md:flex flex-col shrink-0 w-72 lg:w-80 border-r border-border/50 bg-sidebar">
        {/* Sidebar Header */}
        <div className="px-4 py-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-9 w-full rounded-md mt-3" />
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-hidden py-2 space-y-1 px-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            >
              <Skeleton className="h-4 w-4 rounded shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* User Menu */}
        <div className="p-3 border-t border-border/30">
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border/30">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-28" />
        </div>

        {/* Empty Chat Area */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-2xl mx-auto" />
            <Skeleton className="h-6 w-40 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto" />
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-border/30">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-12 w-full rounded-xl" />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
