import { api } from "@/store/api"

export interface PaginationParams {
  page?: number
  limit?: number
}

export interface PaginationResponse {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface AdminStats {
  totalUsers: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  totalDocuments: number
  totalAnnotations: number
  activeUsers: number
  usersByPlan: Array<{ planId: string; count: number }>
  totalStorageMB: number
}

export interface AdminUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string
  planId: string
  subscriptionStatus: string
  isAnonymous: boolean
  createdAt: string
  lastKnownIp: string | null
  _count: {
    documents: number
    annotations: number
  }
}

export interface AdminActivity {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export interface AdminDocument {
  id: string
  name: string
  userId: string
  pageCount: number
  fileSize: number
  status: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export interface AdminApiKey {
  id: string
  name: string
  prefix: string
  userId: string
  createdAt: string
  lastUsedAt: string | null
  expiresAt: string | null
  revokedAt: string | null
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  }
}

export interface AdminHealth {
  status: string
  checks: {
    database: boolean
    redis: boolean
    storage: boolean
  }
  uptime: number
  nodeVersion: string
  env: string
}

export interface AdminErrorLog {
  id: string
  userId: string | null
  userEmail: string | null
  userName: string | null
  errorType: string
  errorCode: string | null
  message: string
  url: string | null
  method: string | null
  statusCode: number | null
  ipAddress: string
  resolved: boolean
  resolvedBy: string | null
  resolvedAt: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string | null
    image: string | null
  } | null
}

export interface AdminErrorStats {
  total: number
  unresolved: number
  resolved: number
  todayCount: number
  byType: Array<{ type: string; count: number }>
  recentErrors: Array<{
    id: string
    errorType: string
    message: string
    createdAt: string
  }>
}

export interface AdminPlan {
  id: string
  name: string
  price: number
  limits: Record<string, number>
  createdAt: string
  _count: {
    users: number
  }
}

const adminApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStats, void>({
      query: () => "/admin/stats",
    }),

    listAdminUsers: builder.query<{ items: AdminUser[]; pagination: PaginationResponse }, { search?: string; role?: string; planId?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/users",
        params,
      }),
      providesTags: [{ type: "AdminUser", id: "LIST" }],
    }),

    createAdminUser: builder.mutation<AdminUser, { email: string; name: string; role?: string; planId?: string }>({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminUser", id: "LIST" }],
    }),

    getAdminUser: builder.query<AdminUser & { usage: Array<{ id: string; metric: string; value: number }>; trialEndsAt: string | null; stripeCustomerId: string | null; _count: { documents: number; annotations: number; apiKeys: number } }, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminUser", id }],
    }),

    updateAdminUser: builder.mutation<AdminUser, { id: string; data: { role?: string; planId?: string; subscriptionStatus?: string } }>({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),

    deleteAdminUser: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminUser", id },
        { type: "AdminUser", id: "LIST" },
      ],
    }),

    listAdminActivity: builder.query<{ items: AdminActivity[]; pagination: PaginationResponse }, { userId?: string; action?: string; resourceType?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/activity",
        params,
      }),
    }),

    listAdminDocuments: builder.query<{ items: AdminDocument[]; pagination: PaginationResponse }, { search?: string; userId?: string; status?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/documents",
        params,
      }),
      providesTags: [{ type: "AdminDocument", id: "LIST" }],
    }),

    getAdminDocument: builder.query<AdminDocument, string>({
      query: (id) => `/admin/documents/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminDocument", id }],
    }),

    deleteAdminDocument: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/documents/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminDocument", id },
        { type: "AdminDocument", id: "LIST" },
      ],
    }),

    listAdminApiKeys: builder.query<{ items: AdminApiKey[]; pagination: PaginationResponse }, { userId?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/api-keys",
        params,
      }),
      providesTags: [{ type: "AdminApiKey", id: "LIST" }],
    }),

    revokeAdminApiKey: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/api-keys/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "AdminApiKey", id: "LIST" }],
    }),

    listAdminPlans: builder.query<AdminPlan[], void>({
      query: () => "/admin/plans",
      providesTags: [{ type: "AdminPlan", id: "LIST" }],
    }),

    getAdminPlan: builder.query<AdminPlan, string>({
      query: (id) => `/admin/plans/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminPlan", id }],
    }),

    createAdminPlan: builder.mutation<AdminPlan, { id: string; name: string; price?: number; limits: Record<string, number> }>({
      query: (body) => ({
        url: "/admin/plans",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "AdminPlan", id: "LIST" }],
    }),

    updateAdminPlan: builder.mutation<AdminPlan, { id: string; data: { name?: string; price?: number; limits?: Record<string, number> } }>({
      query: ({ id, data }) => ({
        url: `/admin/plans/${id}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminPlan", id },
        { type: "AdminPlan", id: "LIST" },
      ],
    }),

    deleteAdminPlan: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/plans/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, id) => [
        { type: "AdminPlan", id },
        { type: "AdminPlan", id: "LIST" },
      ],
    }),

    getAdminHealth: builder.query<AdminHealth, void>({
      query: () => "/admin/health",
    }),

    listAdminErrors: builder.query<{ items: AdminErrorLog[]; pagination: PaginationResponse }, { search?: string; errorType?: string; userId?: string; resolved?: string; startDate?: string; endDate?: string; page?: number; limit?: number }>({
      query: (params) => ({
        url: "/admin/errors",
        params,
      }),
      providesTags: [{ type: "AdminError", id: "LIST" }],
    }),

    getAdminError: builder.query<AdminErrorLog, string>({
      query: (id) => `/admin/errors/${id}`,
      providesTags: (result, error, id) => [{ type: "AdminError", id }],
    }),

    resolveAdminError: builder.mutation<void, { id: string; resolved: boolean; resolvedNotes?: string }>({
      query: ({ id, resolved, resolvedNotes }) => ({
        url: `/admin/errors/${id}`,
        method: "PATCH",
        body: { resolved, resolvedNotes },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "AdminError", id },
        { type: "AdminError", id: "LIST" },
      ],
    }),

    getAdminErrorStats: builder.query<AdminErrorStats, { startDate?: string; endDate?: string }>({
      query: (params) => ({
        url: "/admin/errors/stats",
        params,
      }),
    }),
  }),
})

export const {
  useGetAdminStatsQuery,
  useListAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
  useListAdminActivityQuery,
  useListAdminDocumentsQuery,
  useGetAdminDocumentQuery,
  useDeleteAdminDocumentMutation,
  useListAdminApiKeysQuery,
  useRevokeAdminApiKeyMutation,
  useListAdminPlansQuery,
  useGetAdminPlanQuery,
  useCreateAdminPlanMutation,
  useUpdateAdminPlanMutation,
  useDeleteAdminPlanMutation,
  useGetAdminHealthQuery,
  useListAdminErrorsQuery,
  useGetAdminErrorQuery,
  useResolveAdminErrorMutation,
  useGetAdminErrorStatsQuery,
} = adminApi
