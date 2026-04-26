import type { DocumentMemberRole } from "@prisma/client"

import { api } from "@/store/api"

export interface Collaborator {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: DocumentMemberRole | "OWNER"
}

export const collaborationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listDocumentMembers: builder.query<Collaborator[], string>({
      query: (documentId) => `/documents/${documentId}/members`,
      transformResponse: (response: { data: Collaborator[] }) => response.data,
      providesTags: (_result, _error, documentId) => [
        { type: "Document", id: `MEMBERS-${documentId}` },
      ],
    }),
    addDocumentMember: builder.mutation<
      Collaborator[],
      { documentId: string; email: string; role: DocumentMemberRole }
    >({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/members`,
        method: "POST",
        body,
      }),
      transformResponse: (response: { data: Collaborator[] }) => response.data,
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "Document", id: `MEMBERS-${documentId}` },
        { type: "Document", id: documentId },
      ],
    }),
    removeDocumentMember: builder.mutation<
      void,
      { documentId: string; memberId: string }
    >({
      query: ({ documentId, memberId }) => ({
        url: `/documents/${documentId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { documentId }) => [
        { type: "Document", id: `MEMBERS-${documentId}` },
        { type: "Document", id: documentId },
      ],
    }),
  }),
})

export const {
  useListDocumentMembersQuery,
  useAddDocumentMemberMutation,
  useRemoveDocumentMemberMutation,
} = collaborationApi
