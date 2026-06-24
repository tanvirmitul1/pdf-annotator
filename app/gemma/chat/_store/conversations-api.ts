import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { ChatModel } from "@prisma/client";

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: ChatModel;
  folderId: string | null;
  pinned: boolean;
  archived: boolean;
  archivedAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  folder?: {
    id: string;
    name: string;
  };
  messages?: Array<{
    content: string;
    createdAt: Date;
    role: string;
  }>;
  _count?: {
    messages: number;
  };
}

export interface ConversationListResponse {
  conversations: Conversation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateConversationRequest {
  title?: string;
  model?: ChatModel;
  folderId?: string;
}

export interface UpdateConversationRequest {
  title?: string;
  model?: ChatModel;
  pinned?: boolean;
  archived?: boolean;
  folderId?: string | null;
}

export interface ListConversationsParams {
  page?: number;
  limit?: number;
  search?: string;
  pinned?: boolean;
  archived?: boolean;
  folderId?: string;
}

export const conversationsApi = createApi({
  reducerPath: "conversationsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/gemma/chat" }),
  tagTypes: ["Conversation", "ConversationList"],
  endpoints: (builder) => ({
    listConversations: builder.query<ConversationListResponse, ListConversationsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.page !== undefined) searchParams.set("page", params.page.toString());
        if (params.limit !== undefined) searchParams.set("limit", params.limit.toString());
        if (params.search) searchParams.set("search", params.search);
        if (params.pinned !== undefined) searchParams.set("pinned", params.pinned.toString());
        if (params.archived !== undefined) searchParams.set("archived", params.archived.toString());
        if (params.folderId) searchParams.set("folderId", params.folderId);
        
        return `/conversations?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.conversations.map(({ id }) => ({ type: "Conversation" as const, id })),
              { type: "ConversationList", id: "LIST" },
            ]
          : [{ type: "ConversationList", id: "LIST" }],
    }),

    getConversation: builder.query<Conversation, string>({
      query: (id) => `/conversations/${id}`,
      providesTags: (result, error, id) => [{ type: "Conversation", id }],
    }),

    createConversation: builder.mutation<Conversation, CreateConversationRequest>({
      query: (body) => ({
        url: "/conversations",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ConversationList", id: "LIST" }],
    }),

    updateConversation: builder.mutation<
      Conversation,
      { id: string; updates: UpdateConversationRequest }
    >({
      query: ({ id, updates }) => ({
        url: `/conversations/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "Conversation", id },
        { type: "ConversationList", id: "LIST" },
      ],
    }),

    deleteConversation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/conversations/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "Conversation", id },
        { type: "ConversationList", id: "LIST" },
      ],
    }),

    duplicateConversation: builder.mutation<Conversation, string>({
      query: (id) => ({
        url: `/conversations/${id}/duplicate`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "ConversationList", id: "LIST" }],
    }),
  }),
});

export const {
  useListConversationsQuery,
  useGetConversationQuery,
  useCreateConversationMutation,
  useUpdateConversationMutation,
  useDeleteConversationMutation,
  useDuplicateConversationMutation,
} = conversationsApi;
