import { api } from "@/store/api"
import type { NotificationItem } from "@/lib/db/repositories/notifications"

export interface NotificationPage {
  notifications: NotificationItem[]
  unreadCount: number
}

export const notificationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listNotifications: b.query<NotificationPage, { unreadOnly?: boolean } | void>({
      query: (args) => {
        const params = new URLSearchParams()
        if (args?.unreadOnly) params.set("unreadOnly", "true")
        const qs = params.toString()
        return `/notifications${qs ? `?${qs}` : ""}`
      },
      transformResponse: (res: { data: NotificationPage }) => res.data,
      providesTags: ["Notification"],
    }),

    markNotificationRead: b.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/notifications/${id}`, method: "PATCH" }),
      transformResponse: (res: { data: { success: boolean } }) => res.data,
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData("listNotifications", undefined, (draft) => {
            const n = draft.notifications.find((n) => n.id === id)
            if (n && !n.readAt) {
              n.readAt = new Date().toISOString()
              draft.unreadCount = Math.max(0, draft.unreadCount - 1)
            }
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ["Notification"],
    }),

    markAllNotificationsRead: b.mutation<{ markedRead: number }, void>({
      query: () => ({ url: "/notifications", method: "PATCH" }),
      transformResponse: (res: { data: { markedRead: number } }) => res.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          notificationsApi.util.updateQueryData("listNotifications", undefined, (draft) => {
            const now = new Date().toISOString()
            for (const n of draft.notifications) {
              if (!n.readAt) n.readAt = now
            }
            draft.unreadCount = 0
          })
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ["Notification"],
    }),
  }),
})

export const {
  useListNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} = notificationsApi
