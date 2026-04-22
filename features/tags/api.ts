import { api } from "@/store/api"
import type { TagSummary } from "@/features/annotations/types"

export const tagsApi = api.injectEndpoints({
  endpoints: (b) => ({
    listUserTags: b.query<TagSummary[], void>({
      query: () => "/tags",
      transformResponse: (res: { data: TagSummary[] }) => res.data,
      providesTags: ["Tag"],
    }),
  }),
})

export const { useListUserTagsQuery } = tagsApi
