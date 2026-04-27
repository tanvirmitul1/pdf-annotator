import { api } from "@/store/api"
import type { DocumentMemberRole } from "@prisma/client"

// ── Types ────────────────────────────────────────────────────────────────────

export interface DocumentMember {
  id: string
  userId: string
  role: DocumentMemberRole | "OWNER"
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export interface ListMembersArg {
  documentId: string
}

export interface InviteMemberArg {
  documentId: string
  email: string
  role: DocumentMemberRole
}

export interface UpdateMemberRoleArg {
  documentId: string
  memberId: string
  role: DocumentMemberRole
}

export interface RemoveMemberArg {
  documentId: string
  memberId: string
}

// ── API slice ────────────────────────────────────────────────────────────────

export const membersApi = api.injectEndpoints({
  endpoints: (b) => ({
    /** List all members of a document */
    listMembers: b.query<DocumentMember[], ListMembersArg>({
      query: ({ documentId }) => `/documents/${documentId}/members`,
      transformResponse: (res: { data: DocumentMember[] }) => res.data,
      providesTags: (result, _e, { documentId }) => [
        ...(result?.map((m) => ({ type: "DocumentMember" as const, id: m.id })) ?? []),
        { type: "DocumentMember", id: `LIST-${documentId}` },
      ],
    }),

    /** Invite a new member to a document */
    inviteMember: b.mutation<DocumentMember, InviteMemberArg>({
      query: ({ documentId, ...body }) => ({
        url: `/documents/${documentId}/members`,
        method: "POST",
        body,
      }),
      transformResponse: (res: { data: DocumentMember }) => res.data,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "DocumentMember", id: `LIST-${documentId}` },
      ],
    }),

    /** Update a member's role */
    updateMemberRole: b.mutation<DocumentMember, UpdateMemberRoleArg>({
      query: ({ documentId, memberId, role }) => ({
        url: `/documents/${documentId}/members/${memberId}`,
        method: "PATCH",
        body: { role },
      }),
      transformResponse: (res: { data: DocumentMember }) => res.data,
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "DocumentMember", id: `LIST-${documentId}` },
      ],
    }),

    /** Remove a member from a document */
    removeMember: b.mutation<void, RemoveMemberArg>({
      query: ({ documentId, memberId }) => ({
        url: `/documents/${documentId}/members/${memberId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { documentId }) => [
        { type: "Document", id: documentId },
        { type: "DocumentMember", id: `LIST-${documentId}` },
      ],
    }),
  }),
})

export const {
  useListMembersQuery,
  useInviteMemberMutation,
  useUpdateMemberRoleMutation,
  useRemoveMemberMutation,
} = membersApi
