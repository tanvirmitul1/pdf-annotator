import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"

const baseUrl =
  typeof window !== "undefined" && window.location?.origin
    ? new URL("/api", window.location.origin).toString()
    : "/api"

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
})

/**
 * Wraps fetchBaseQuery to handle 401 responses globally.
 * When the server returns 401, the session has expired — redirect to login.
 */
const baseQueryWith401Redirect: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401 && typeof window !== "undefined") {
    const loginUrl = new URL("/login", window.location.origin)
    loginUrl.searchParams.set("callbackUrl", window.location.pathname)
    window.location.href = loginUrl.toString()
  }

  return result
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWith401Redirect,
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
    "Comment",
    "Notification",
    "DocumentMember",
    "AdminUser",
    "AdminDocument",
    "AdminApiKey",
    "AdminPlan",
    "AdminError",
    "DashboardStats",
  ],
  endpoints: () => ({}),
  keepUnusedDataFor: 60,
})
