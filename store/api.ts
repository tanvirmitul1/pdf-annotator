import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

const baseUrl =
  typeof window !== "undefined" && window.location?.origin
    ? new URL("/api", window.location.origin).toString()
    : "/api"

export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl,
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
