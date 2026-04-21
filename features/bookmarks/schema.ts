import { z } from "zod"

export const CreateBookmarkSchema = z.object({
  pageNumber: z.number().int().min(1),
  label: z.string().max(200).optional(),
})

export const UpdateBookmarkSchema = z.object({
  label: z.string().max(200),
})

export type CreateBookmarkInput = z.infer<typeof CreateBookmarkSchema>
export type UpdateBookmarkInput = z.infer<typeof UpdateBookmarkSchema>
