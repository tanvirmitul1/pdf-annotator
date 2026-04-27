import { api } from "@/store/api"

export interface ShareLink {
  id: string
  documentId: string
  token: string
  expiresAt: string | null
  revokedAt: string | null
  createdAt: string
}

export interface GetShareLinkResponse {
  shareLink: ShareLink | null
}

const shareLinksApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getShareLink: builder.query<GetShareLinkResponse, { documentId: string }>({
      query: ({ documentId }) => `/documents/${documentId}/share-links`,
      providesTags: (result, error, { documentId }) => [
        { type: "ShareLink", id: documentId },
      ],
    }),

    createShareLink: builder.mutation<GetShareLinkResponse, { documentId: string }>({
      query: ({ documentId }) => ({
        url: `/documents/${documentId}/share-links`,
        method: "POST",
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "ShareLink", id: documentId },
      ],
    }),

    revokeShareLink: builder.mutation<void, { documentId: string; linkId: string }>({
      query: ({ documentId, linkId }) => ({
        url: `/documents/${documentId}/share-links/${linkId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { documentId }) => [
        { type: "ShareLink", id: documentId },
      ],
    }),
  }),
})

export const {
  useGetShareLinkQuery,
  useCreateShareLinkMutation,
  useRevokeShareLinkMutation,
} = shareLinksApi
