import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    credentials: "include",
  }),
  tagTypes: [
    "Me",
    "Plan",
    "Usage",
    "Document",
    "Annotation",
    "Tag",
    "Collection",
    "Bookmark",
    "ReadingProgress",
    "ShareLink",
    "AuditLog",
  ],
  endpoints: () => ({}),
  keepUnusedDataFor: 60,
})
