import { api } from "@/store/api"
import type { Bookmark } from "@prisma/client"

import type { CreateBookmarkInput, UpdateBookmarkInput } from "./schema"

export interface BookmarkWithMeta extends Bookmark {
  label: string | null
}

export const bookmarksApi = api.injectEndpoints({
  endpoints: (b) => ({
    listBookmarks: b.query<BookmarkWithMeta[], string>({
      query: (documentId) => `/documents/${documentId}/bookmarks`,
      transformResponse: (res: { data: BookmarkWithMeta[] }) => res.data,
      providesTags: (_r, _e, documentId) => [
        { type: "Bookmark", id: `LIST-${documentId}` },
      ],
    }),

    createBookmark: b.mutation<
      BookmarkWithMeta,
      { documentId: string } & CreateBookmarkInput
    >({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/bookmarks`,
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: BookmarkWithMeta }) => res.data,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Bookmark", id: `LIST-${documentId}` },
      ],
    }),

    deleteBookmark: b.mutation<
      void,
      { documentId: string; bookmarkId: string }
    >({
      query: ({ documentId, bookmarkId }) => ({
        url: `/documents/${documentId}/bookmarks/${bookmarkId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Bookmark", id: `LIST-${documentId}` },
      ],
    }),

    renameBookmark: b.mutation<
      BookmarkWithMeta,
      { documentId: string; bookmarkId: string } & UpdateBookmarkInput
    >({
      query: ({ documentId, bookmarkId, ...body }) => ({
        url: `/documents/${documentId}/bookmarks/${bookmarkId}`,
        method: "PATCH",
        body,
      }),
      transformResponse: (res: { data: BookmarkWithMeta }) => res.data,
      async onQueryStarted(
        { documentId, bookmarkId, label },
        { dispatch, queryFulfilled }
      ) {
        const patch = dispatch(
          bookmarksApi.util.updateQueryData(
            "listBookmarks",
            documentId,
            (draft) => {
              const bm = draft.find((b) => b.id === bookmarkId)
              if (bm) bm.label = label
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
        { type: "Bookmark", id: `LIST-${documentId}` },
      ],
    }),
  }),
})

export const {
  useListBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useRenameBookmarkMutation,
} = bookmarksApi
