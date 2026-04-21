import { api } from "@/store/api"
import { z } from "zod"
import { RenameDocumentSchema, ListDocumentsParamsSchema } from "./schema"

export interface Document {
  id: string
  name: string
  fileSize: number
  thumbnailKey?: string | null
  createdAt: string
  lastOpenedAt: string | null
  deletedAt?: string | null
  status: string
  processingProgress: number
}

export interface ListDocumentsResponse {
  items: Document[]
  nextCursor?: string
  hasMore: boolean
}

export interface UploadDocumentResponse {
  document: Document
}

export interface DownloadDocumentResponse {
  url: string
}

const documentsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listDocuments: builder.query<ListDocumentsResponse, z.infer<typeof ListDocumentsParamsSchema>>({
      query: (params) => ({
        url: "/documents",
        params,
      }),
      providesTags: ["Document"],
    }),

    getDocument: builder.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (result, error, id) => [{ type: "Document", id }],
    }),

    uploadDocument: builder.mutation<UploadDocumentResponse, FormData>({
      query: (formData) => ({
        url: "/documents/upload",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Document"],
    }),

    renameDocument: builder.mutation<void, { id: string; data: z.infer<typeof RenameDocumentSchema> }>({
      query: ({ id, data }) => ({
        url: `/documents/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Document", id }],
    }),

    deleteDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/documents/${id}/delete`,
        method: "DELETE",
      }),
      invalidatesTags: ["Document"],
    }),

    restoreDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/documents/${id}/restore`,
        method: "POST",
      }),
      invalidatesTags: ["Document"],
    }),

    downloadDocument: builder.query<DownloadDocumentResponse, { id: string; flavor?: "original" | "thumbnail" }>({
      query: ({ id, flavor = "original" }) => ({
        url: `/documents/${id}/download`,
        params: { flavor },
      }),
    }),

    reprocessDocument: builder.mutation<void, string>({
      query: (id) => ({
        url: `/documents/${id}/reprocess`,
        method: "POST",
      }),
      invalidatesTags: ["Document"],
    }),
  }),
})

export const {
  useListDocumentsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useRenameDocumentMutation,
  useDeleteDocumentMutation,
  useRestoreDocumentMutation,
  useDownloadDocumentQuery,
  useReprocessDocumentMutation,
} = documentsApi