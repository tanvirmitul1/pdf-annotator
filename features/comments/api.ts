import { api } from "@/store/api"
import type { CommentWithAuthor, CommentPage, ReactionSummary } from "@/lib/db/repositories/comments"

// ── Arg types ────────────────────────────────────────────────────────────────

export interface ListCommentsArg {
  annotationId: string
  cursor?: string
}

export interface CreateCommentArg {
  annotationId: string
  content: string
  parentId?: string
  mentions?: string[]
}

export interface UpdateCommentArg {
  id: string
  annotationId: string
  content: string
  mentions?: string[]
}

export interface DeleteCommentArg {
  id: string
  annotationId: string
}

export interface ToggleReactionArg {
  commentId: string
  annotationId: string
  emoji: string
}

// ── API slice ────────────────────────────────────────────────────────────────

export const commentsApi = api.injectEndpoints({
  endpoints: (b) => ({
    /** Fetch (paginated) comments for an annotation. */
    listComments: b.query<CommentPage, ListCommentsArg>({
      query: ({ annotationId, cursor }) => {
        const params = new URLSearchParams()
        if (cursor) params.set("cursor", cursor)
        const qs = params.toString()
        return `/annotations/${annotationId}/comments${qs ? `?${qs}` : ""}`
      },
      transformResponse: (res: { data: CommentPage }) => res.data,
      providesTags: (result, _e, { annotationId }) => [
        ...(result?.comments.map((c) => ({ type: "Comment" as const, id: c.id })) ?? []),
        { type: "Comment", id: `LIST-${annotationId}` },
      ],
    }),

    createComment: b.mutation<CommentWithAuthor, CreateCommentArg>({
      query: ({ annotationId, ...body }) => ({
        url: `/annotations/${annotationId}/comments`,
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: CommentWithAuthor }) => res.data,
      async onQueryStarted(input, { dispatch, queryFulfilled, getState }) {
        const tempId = `temp-${crypto.randomUUID()}`
        const state = getState() as {
          auth?: { user?: { id: string; name: string | null; email: string | null; image: string | null } | null }
        }
        const currentUser = state.auth?.user

        const optimistic: CommentWithAuthor = {
          id: tempId,
          annotationId: input.annotationId,
          userId: currentUser?.id ?? "optimistic",
          parentId: input.parentId ?? null,
          content: input.content,
          editedAt: null,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          author: currentUser ?? { id: "optimistic", name: null, email: null, image: null },
          mentions: [],
          reactions: [],
          replyCount: 0,
        }

        const patch = dispatch(
          commentsApi.util.updateQueryData(
            "listComments",
            { annotationId: input.annotationId },
            (draft) => {
              draft.comments.push(optimistic)
              draft.total += 1
            }
          )
        )

        try {
          const { data } = await queryFulfilled
          dispatch(
            commentsApi.util.updateQueryData(
              "listComments",
              { annotationId: input.annotationId },
              (draft) => {
                const idx = draft.comments.findIndex((c) => c.id === tempId)
                if (idx >= 0) draft.comments[idx] = data
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { annotationId }) => [
        { type: "Comment", id: `LIST-${annotationId}` },
      ],
    }),

    updateComment: b.mutation<CommentWithAuthor, UpdateCommentArg>({
      query: ({ id, content, mentions }) => ({
        url: `/comments/${id}`,
        method: "PATCH",
        body: { content, mentions },
      }),
      transformResponse: (res: { data: CommentWithAuthor }) => res.data,
      async onQueryStarted({ id, annotationId, content }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          commentsApi.util.updateQueryData(
            "listComments",
            { annotationId },
            (draft) => {
              const c = draft.comments.find((c) => c.id === id)
              if (c) {
                c.content = content
                c.editedAt = new Date().toISOString()
              }
            }
          )
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: "Comment", id }],
    }),

    deleteComment: b.mutation<void, DeleteCommentArg>({
      query: ({ id }) => ({ url: `/comments/${id}`, method: "DELETE" }),
      async onQueryStarted({ id, annotationId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          commentsApi.util.updateQueryData(
            "listComments",
            { annotationId },
            (draft) => {
              const idx = draft.comments.findIndex((c) => c.id === id)
              if (idx >= 0) {
                draft.comments.splice(idx, 1)
                draft.total = Math.max(0, draft.total - 1)
              }
            }
          )
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { id, annotationId }) => [
        { type: "Comment", id },
        { type: "Comment", id: `LIST-${annotationId}` },
      ],
    }),

    toggleReaction: b.mutation<ReactionSummary[], ToggleReactionArg>({
      query: ({ commentId, emoji }) => ({
        url: `/comments/${commentId}/reactions`,
        method: "POST",
        body: { emoji },
      }),
      transformResponse: (res: { data: ReactionSummary[] }) => res.data,
      async onQueryStarted({ commentId, annotationId, emoji }, { dispatch, queryFulfilled, getState }) {
        const state = getState() as {
          auth?: { user?: { id: string } | null }
        }
        const currentUserId = state.auth?.user?.id

        // Optimistic toggle
        const patch = dispatch(
          commentsApi.util.updateQueryData(
            "listComments",
            { annotationId },
            (draft) => {
              const comment = draft.comments.find((c) => c.id === commentId)
              if (!comment) return
              const existing = comment.reactions.find((r) => r.emoji === emoji)
              if (existing) {
                if (existing.reactedByMe) {
                  existing.count -= 1
                  existing.reactedByMe = false
                  if (existing.count === 0) {
                    comment.reactions = comment.reactions.filter((r) => r.emoji !== emoji)
                  }
                } else {
                  existing.count += 1
                  existing.reactedByMe = true
                }
              } else {
                comment.reactions.push({ emoji, count: 1, reactedByMe: true })
              }
            }
          )
        )

        try {
          const { data: serverReactions } = await queryFulfilled
          // Reconcile with server truth
          dispatch(
            commentsApi.util.updateQueryData(
              "listComments",
              { annotationId },
              (draft) => {
                const comment = draft.comments.find((c) => c.id === commentId)
                if (comment) comment.reactions = serverReactions
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const {
  useListCommentsQuery,
  useCreateCommentMutation,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
  useToggleReactionMutation,
} = commentsApi
