import { api } from "@/store/api"

interface DashboardStatsResponse {
  documentCount: number
  chatCount: number
  serviceAccess: Array<{
    service: string
    enabled: boolean
  }>
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
}

export const dashboardApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardStats: builder.query<DashboardStatsResponse, void>({
      query: () => "/services/dashboard/stats",
      providesTags: ["DashboardStats"],
    }),
  }),
})

export const { useGetDashboardStatsQuery } = dashboardApi
