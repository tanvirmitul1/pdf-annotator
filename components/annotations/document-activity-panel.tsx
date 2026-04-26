"use client"

import { useMemo } from "react"
import { formatDistanceToNow } from "date-fns"
import { Users, MessageSquare } from "lucide-react"

import { useListByDocumentQuery } from "@/features/annotations/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface DocumentActivityPanelProps {
  documentId: string
  onFilterByUser?: (userId: string | null) => void
  selectedUserId?: string | null
}

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const source = (name || email || "?").trim()
  return source.slice(0, 2).toUpperCase()
}

interface UserActivity {
  userId: string
  userName: string | null
  userEmail: string | null
  userImage: string | null
  annotationCount: number
  lastActive: string
  annotationTypes: Record<string, number>
}

export function DocumentActivityPanel({
  documentId,
  onFilterByUser,
  selectedUserId,
}: DocumentActivityPanelProps) {
  const { data: annotations = [], isLoading } =
    useListByDocumentQuery(documentId)

  const userActivities = useMemo(() => {
    const activityMap = new Map<string, UserActivity>()

    annotations.forEach((annotation) => {
      const userId = annotation.userId
      const existing = activityMap.get(userId)

      if (existing) {
        existing.annotationCount += 1
        const annotationDate = new Date(annotation.createdAt).getTime()
        if (annotationDate > new Date(existing.lastActive).getTime()) {
          existing.lastActive = annotation.createdAt
        }
        existing.annotationTypes[annotation.type] =
          (existing.annotationTypes[annotation.type] || 0) + 1
      } else {
        activityMap.set(userId, {
          userId,
          userName: annotation.author?.name ?? null,
          userEmail: annotation.author?.email ?? null,
          userImage: annotation.author?.image ?? null,
          annotationCount: 1,
          lastActive: annotation.createdAt,
          annotationTypes: { [annotation.type]: 1 },
        })
      }
    })

    return Array.from(activityMap.values()).sort(
      (a, b) =>
        new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
    )
  }, [annotations])

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex animate-pulse items-center gap-3">
            <div className="size-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 rounded bg-muted" />
              <div className="h-2 w-16 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (userActivities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="mb-2 size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Annotations will appear here once users start collaborating
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Activity</h3>
          <Badge variant="secondary" className="ml-auto text-[10px]">
            {userActivities.length}{" "}
            {userActivities.length === 1 ? "user" : "users"}
          </Badge>
        </div>

        {userActivities.map((activity) => {
          const isSelected = selectedUserId === activity.userId
          const topTypes = Object.entries(activity.annotationTypes)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 2)
            .map(([type]) => type)

          return (
            <button
              key={activity.userId}
              type="button"
              onClick={() =>
                onFilterByUser?.(isSelected ? null : activity.userId)
              }
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-all hover:bg-accent",
                isSelected
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border/40 bg-card/50"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="size-10 shrink-0">
                  <AvatarImage src={activity.userImage ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(activity.userName, activity.userEmail)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {activity.userName ||
                        activity.userEmail ||
                        "Unknown User"}
                    </p>
                    {isSelected && (
                      <Badge variant="default" className="text-[9px]">
                        Selected
                      </Badge>
                    )}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="size-3" />
                      <span>{activity.annotationCount} annotations</span>
                    </div>
                    <span>
                      Last active{" "}
                      {formatDistanceToNow(new Date(activity.lastActive), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {topTypes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {topTypes.map((type) => (
                        <Badge
                          key={type}
                          variant="outline"
                          className="text-[9px] capitalize"
                        >
                          {type.toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          )
        })}

        {selectedUserId && (
          <button
            type="button"
            onClick={() => onFilterByUser?.(null)}
            className="mt-2 w-full rounded-md border border-border/60 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Clear filter
          </button>
        )}
      </div>
    </ScrollArea>
  )
}
