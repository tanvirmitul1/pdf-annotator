import { z } from "zod"

export const CreateDocumentSchema = z.object({
  file: z.instanceof(File),
})

export const RenameDocumentSchema = z.object({
  name: z.string().min(1).max(255),
})

export const ListDocumentsParamsSchema = z.object({
  collection: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["name", "createdAt", "lastOpenedAt"]).default("lastOpenedAt"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
})