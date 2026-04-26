import { api } from "@/store/api"
import type { AnnotationWithTags, TagSummary } from "./types"
import type { CreateAnnotationInput, UpdateAnnotationInput } from "./schema"

export interface CreateAnnotationArg extends CreateAnnotationInput {
  documentId: string
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

    // ─── Create annotation (optimistic) ─────────────────────────────────────
    createAnnotation: b.mutation<AnnotationWithTags, CreateAnnotationArg>({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/annotations`,
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: AnnotationWithTags }) => res.data,
      async onQueryStarted(input, { dispatch, queryFulfilled }) {
        const tempId = `temp-${crypto.randomUUID()}`
        const optimistic: AnnotationWithTags = {
          id: tempId,
          userId: "optimistic",
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
          const { data } = await queryFulfilled
          dispatch(
            annotationsApi.util.updateQueryData(
              "listByDocument",
              input.documentId,
              (draft) => {
                const idx = draft.findIndex((a) => a.id === tempId)
                if (idx >= 0) draft[idx] = data
              }
            )
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Annotation", id: `LIST-${documentId}` },
      ],
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
  useUpdateAnnotationMutation,
  useDeleteAnnotationMutation,
  useAddTagMutation,
  useRemoveTagMutation,
} = annotationsApi
