import { prisma } from "@/lib/db/prisma"

export interface NotificationItem {
  id: string
  type: string
  title: string
  body: string
  annotationId: string | null
  commentId: string | null
  actorId: string | null
  readAt: string | null
  createdAt: string
  actor: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
}

export function notificationsFor(userId: string) {
  return {
    /** List unread + recent notifications for the user. */
    list: async (options?: { limit?: number; unreadOnly?: boolean }): Promise<{
      notifications: NotificationItem[]
      unreadCount: number
    }> => {
      const limit = options?.limit ?? 30
      const [rows, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: {
            userId,
            ...(options?.unreadOnly ? { readAt: null } : {}),
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        }),
        prisma.notification.count({
          where: { userId, readAt: null },
        }),
      ])

      // Resolve actors in batch
      const actorIds = [...new Set(rows.map((r) => r.actorId).filter(Boolean) as string[])]
      const actors = actorIds.length
        ? await prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, name: true, email: true, image: true },
          })
        : []
      const actorMap = new Map(actors.map((a) => [a.id, a]))

      return {
        notifications: rows.map((r) => ({
          id: r.id,
          type: r.type,
          title: r.title,
          body: r.body,
          annotationId: r.annotationId,
          commentId: r.commentId,
          actorId: r.actorId,
          readAt: r.readAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
          actor: r.actorId ? (actorMap.get(r.actorId) ?? null) : null,
        })),
        unreadCount,
      }
    },

    /** Mark one notification as read. */
    markRead: async (notificationId: string): Promise<boolean> => {
      const existing = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
        select: { id: true },
      })
      if (!existing) return false
      await prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      })
      return true
    },

    /** Mark all notifications as read. */
    markAllRead: async (): Promise<number> => {
      const result = await prisma.notification.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      })
      return result.count
    },
  }
}
