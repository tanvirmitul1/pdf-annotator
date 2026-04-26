import { api } from "@/store/api"
import type { Bookmark, ReadingProgress } from "@prisma/client"
import type { DocumentMemberRole } from "@prisma/client"

export interface DocumentOutlineEntry {
  title: string
  dest: string | null
  pageNumber: number | null
  items: DocumentOutlineEntry[]
}

export interface ViewerData {
  document: {
    id: string
    name: string
    pageCount: number
    status: string
    storageKey: string
    thumbnailKey: string | null
  }
  collaborators: Array<{
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: DocumentMemberRole | "OWNER"
  }>
  permissions: {
    role: DocumentMemberRole | "OWNER"
    canManageMembers: boolean
    canAnnotate: boolean
  }
  outline: DocumentOutlineEntry[] | null
  bookmarks: Bookmark[]
  readingProgress: ReadingProgress | null
}

export const viewerApi = api.injectEndpoints({
  endpoints: (b) => ({
    getDocumentViewerData: b.query<ViewerData, string>({
      query: (id) => `/documents/${id}/viewer-data`,
      transformResponse: (res: { data: ViewerData }) => res.data,
      providesTags: (_r, _e, id) => [
        { type: "Document", id },
        { type: "Bookmark", id: `LIST-${id}` },
        { type: "ReadingProgress", id },
      ],
    }),

    updateReadingProgress: b.mutation<
      ReadingProgress,
      { documentId: string; lastPage: number; percentComplete: number }
    >({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/reading-progress`,
        method: "PUT",
        body,
      }),
      transformResponse: (res: { data: ReadingProgress }) => res.data,
      async onQueryStarted(
        { documentId, lastPage, percentComplete },
        { dispatch, queryFulfilled }
      ) {
        const patch = dispatch(
          viewerApi.util.updateQueryData(
            "getDocumentViewerData",
            documentId,
            (draft) => {
              if (draft.readingProgress) {
                draft.readingProgress.lastPage = lastPage
                draft.readingProgress.percentComplete = percentComplete
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
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "ReadingProgress", id: documentId },
      ],
    }),
  }),
})

export const {
  useGetDocumentViewerDataQuery,
  useUpdateReadingProgressMutation,
} = viewerApi
