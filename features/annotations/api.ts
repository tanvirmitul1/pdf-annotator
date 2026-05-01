import { api } from "@/store/api"
import { generateUUID } from "@/lib/utils/uuid"
import type { RootState } from "@/store"
import type { AnnotationWithTags, TagSummary } from "./types"
import type { CreateAnnotationInput, UpdateAnnotationInput } from "./schema"

export interface CreateAnnotationArg extends CreateAnnotationInput {
  documentId: string
  clientId?: string // For idempotent upserts
}

// For bulk API — documentId is sent at top level, not per item
export interface BulkAnnotationItem extends CreateAnnotationInput {
  clientId?: string
}

export interface UpdateAnnotationArg extends UpdateAnnotationInput {
  id: string
  documentId: string // needed to update the correct list cache
}

export interface DeleteAnnotationArg {
  id: string
  documentId: string
}

export interface AddTagArg {
  annotationId: string
  documentId: string
  label: string
}

export interface RemoveTagArg {
  annotationId: string
  documentId: string
  tagId: string
}

export const annotationsApi = api.injectEndpoints({
  endpoints: (b) => ({
    // ─── List all annotations for a document ──────────────────────────────────
    listByDocument: b.query<AnnotationWithTags[], string>({
      query: (documentId) => `/documents/${documentId}/annotations`,
      transformResponse: (res: { data: AnnotationWithTags[] }) => res.data,
      providesTags: (result, _e, docId) => [
        ...(result?.map((a) => ({ type: "Annotation" as const, id: a.id })) ?? []),
        { type: "Annotation", id: `LIST-${docId}` },
      ],
    }),

    // ─── Bulk create annotations (background sync — no optimistic update) ───
    // Cache is already populated by useAnnotationManager before this is called.
    // This endpoint only syncs to server and returns IDs.
    bulkCreateAnnotations: b.mutation<
      { id: string; clientId?: string; status: string }[],
      { documentId: string; annotations: BulkAnnotationItem[] }
    >({
      query: ({ documentId, annotations }) => ({
        url: `/annotations/bulk`,
        method: "POST",
        body: {
          documentId,
          annotations,
        },
      }),
      transformResponse: (res: { data: Array<{ id: string; clientId?: string; status: string }>; count: number }) => res.data,
      // No onQueryStarted — cache already has the annotations locally
      invalidatesTags: [],
    }),

    // ─── Create annotation (optimistic) ─────────────────────────────────────
    createAnnotation: b.mutation<
      { id: string; clientId?: string; status: string },
      CreateAnnotationArg
    >({
      query: ({ documentId, clientId, ...body }) => ({
        url: `/documents/${documentId}/annotations`,
        method: "POST",
        body: { ...body, clientId }, // Send clientId to server for idempotency
      }),
      transformResponse: (res: { data: { id: string; clientId?: string; status: string } }) => res.data,
      async onQueryStarted(input, { dispatch, getState, queryFulfilled }) {
        const state = getState() as RootState
        const currentUser = state.auth.user
        const tempId = `temp-${generateUUID()}`
        const optimistic: AnnotationWithTags = {
          id: tempId,
          userId: currentUser?.id ?? "optimistic",
          documentId: input.documentId,
          pageNumber: input.pageNumber,
          type: input.type,
          status: input.status ?? "OPEN",
          color: input.color,
          positionData: input.positionData,
          content: input.content ?? null,
          deletedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          author: currentUser
            ? {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                image: currentUser.image,
              }
            : null,
          assignee: null,
        }
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            input.documentId,
            (draft) => {
              draft.push(optimistic)
            }
          )
        )
        try {
          const { data: serverResponse } = await queryFulfilled
          // Replace optimistic entry with server-confirmed ID
          dispatch(
            annotationsApi.util.updateQueryData(
              "listByDocument",
              input.documentId,
              (draft) => {
                const idx = draft.findIndex((a) => a.id === tempId)
                if (idx >= 0) {
                  draft[idx].id = serverResponse.id
                  draft[idx].userId = currentUser?.id ?? draft[idx].userId
                }
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
      // No invalidation needed - cache already updated
      invalidatesTags: [],
    }),

    // ─── Update annotation (optimistic) ──────────────────────────────────────
    updateAnnotation: b.mutation<AnnotationWithTags, UpdateAnnotationArg>({
      query: ({ id, documentId, ...body }) => {
        void documentId
        return {
          url: `/annotations/${id}`,
          method: "PATCH",
          body,
        }
      },
      transformResponse: (res: { data: AnnotationWithTags }) => res.data,
      async onQueryStarted({ id, documentId, ...changes }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            documentId,
            (draft) => {
              const a = draft.find((a) => a.id === id)
              if (a) {
                Object.assign(a, changes)
                if (changes.assigneeId === null) {
                  a.assignee = null
                }
              }
            }
          )
        )
        try {
          const { data } = await queryFulfilled
          dispatch(
            annotationsApi.util.updateQueryData(
              "listByDocument",
              documentId,
              (draft) => {
                const idx = draft.findIndex((annotation) => annotation.id === id)
                if (idx >= 0) {
                  draft[idx] = data
                }
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: "Annotation", id }],
    }),

    // ─── Delete annotation (optimistic) ──────────────────────────────────────
    // ─── Delete annotation (optimistic) ──────────────────────────────────────
    deleteAnnotation: b.mutation<AnnotationWithTags, DeleteAnnotationArg>({
      query: ({ id }) => ({ url: `/annotations/${id}`, method: "DELETE" }),
      transformResponse: (res: { data: AnnotationWithTags }) => res.data,
      async onQueryStarted({ id, documentId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            documentId,
            (draft) => {
              const idx = draft.findIndex((a) => a.id === id)
              if (idx >= 0) draft.splice(idx, 1)
            }
          )
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { id, documentId }) => [
        { type: "Annotation", id },
        { type: "Annotation", id: `LIST-${documentId}` },
      ],
    }),

    // ─── Restore annotation (undo delete) ───────────────────────────────────
    restoreAnnotation: b.mutation<AnnotationWithTags, DeleteAnnotationArg>({
      query: ({ id }) => ({
        url: `/annotations/${id}/restore`,
        method: "POST",
      }),
      transformResponse: (res: { data: AnnotationWithTags }) => res.data,
      async onQueryStarted({ id, documentId }, { dispatch, queryFulfilled }) {
        try {
          const { data: restoredAnnotation } = await queryFulfilled
          dispatch(
            annotationsApi.util.updateQueryData("listByDocument", documentId, (draft) => {
              const existing = draft.find((a) => a.id === id)
              if (existing) {
                Object.assign(existing, restoredAnnotation)
              } else {
                draft.push(restoredAnnotation)
              }
            })
          )
        } catch {
          // Failure handles invalidation natively
        }
      },
      invalidatesTags: (_r, _e, arg) => [{ type: "Annotation", id: `LIST-${arg.documentId}` }],
    }),

    // ─── Add tag to annotation (optimistic) ──────────────────────────────────
    addTag: b.mutation<TagSummary, AddTagArg>({
      query: ({ annotationId, label }) => ({
        url: `/annotations/${annotationId}/tags`,
        method: "POST",
        body: { label },
      }),
      transformResponse: (res: { data: TagSummary }) => res.data,
      async onQueryStarted({ annotationId, documentId, label }, { dispatch, queryFulfilled }) {
        const tempTag: TagSummary = { id: `temp-${label}`, label, color: null }
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            documentId,
            (draft) => {
              const a = draft.find((a) => a.id === annotationId)
              if (a && !a.tags.some((t) => t.label === label)) {
                a.tags.push(tempTag)
              }
            }
          )
        )
        try {
          const { data: realTag } = await queryFulfilled
          dispatch(
            annotationsApi.util.updateQueryData(
              "listByDocument",
              documentId,
              (draft) => {
                const a = draft.find((a) => a.id === annotationId)
                if (a) {
                  const idx = a.tags.findIndex((t) => t.id === tempTag.id)
                  if (idx >= 0) a.tags[idx] = realTag
                }
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ["Tag"],
    }),

    // ─── Remove tag from annotation (optimistic) ─────────────────────────────
    removeTag: b.mutation<void, RemoveTagArg>({
      query: ({ annotationId, tagId }) => ({
        url: `/annotations/${annotationId}/tags/${tagId}`,
        method: "DELETE",
      }),
      async onQueryStarted({ annotationId, documentId, tagId }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            documentId,
            (draft) => {
              const a = draft.find((a) => a.id === annotationId)
              if (a) a.tags = a.tags.filter((t) => t.id !== tagId)
            }
          )
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),
  }),
})

export const {
  useListByDocumentQuery,
  useCreateAnnotationMutation,
  useBulkCreateAnnotationsMutation,
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
  useRestoreAnnotationMutation,
  useAddTagMutation,
  useRemoveTagMutation,
} = annotationsApi
