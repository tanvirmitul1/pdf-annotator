"use client"

import { useState } from "react"
import { Bell, Check, CheckCheck, MessageSquare, AtSign, Reply } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/features/notifications/api"
import type { NotificationItem } from "@/lib/db/repositories/notifications"

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  return ((name || email || "?").trim()).slice(0, 2).toUpperCase()
}

function NotificationIcon({ type }: { type: string }) {
  if (type === "MENTION") return <AtSign className="size-3.5 text-primary" />
  if (type === "REPLY") return <Reply className="size-3.5 text-blue-500" />
  return <MessageSquare className="size-3.5 text-muted-foreground" />
}

function NotificationRow({
  notification,
  onRead,
}: {
  notification: NotificationItem
  onRead: (id: string) => void
}) {
  const isUnread = !notification.readAt

  return (
    <button
      type="button"
      onClick={() => { if (isUnread) onRead(notification.id) }}
      className={cn(
        "w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent/60",
        isUnread && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-2.5">
        {/* Actor avatar */}
        <div className="relative shrink-0">
          <Avatar className="size-8">
            <AvatarImage src={notification.actor?.image ?? undefined} />
            <AvatarFallback className="text-[10px]">
              {getInitials(notification.actor?.name, notification.actor?.email)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full border-2 border-background bg-background">
            <NotificationIcon type={notification.type} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("text-xs leading-snug", isUnread ? "font-medium" : "text-muted-foreground")}>
            {notification.title}
          </p>
          {notification.body && (
            <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
              &ldquo;{notification.body}&rdquo;
            </p>
          )}
          <p className="mt-1 text-[10px] text-muted-foreground/70">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
        </div>

        {/* Unread dot */}
        {isUnread && (
          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </div>
    </button>
  )
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)

  const { data } = useListNotificationsQuery(undefined, {
    pollingInterval: 30_000, // Poll every 30s for new notifications
  })

  const [markRead] = useMarkNotificationReadMutation()
  const [markAllRead] = useMarkAllNotificationsReadMutation()

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  const handleMarkRead = (id: string) => {
    void markRead(id)
  }

  const handleMarkAll = () => {
    void markAllRead()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full p-0 text-[9px] font-bold"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between border-b px-3 py-2.5">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={handleMarkAll}
            >
              <CheckCheck className="size-3" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Bell className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="space-y-0.5 p-1.5">
              {notifications.map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onRead={handleMarkRead}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="px-3 py-2 text-center">
              <p className="text-[11px] text-muted-foreground">
                Showing {notifications.length} recent notifications
              </p>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
