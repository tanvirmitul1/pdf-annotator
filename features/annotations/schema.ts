import { z } from "zod"

// ─── Hex color validator ──────────────────────────────────────────────────────
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")

// ─── Position data sub-schemas ────────────────────────────────────────────────
const TextRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
})

const TextAnchorSchema = z.object({
  rects: z.array(TextRectSchema).min(1),
  quotedText: z.string().max(5000),
  prefix: z.string().max(64),
  suffix: z.string().max(64),
})

const TextPositionDataSchema = z.object({
  kind: z.literal("TEXT"),
  pageNumber: z.number().int().positive(),
  anchor: TextAnchorSchema,
})

const PointPositionDataSchema = z.object({
  kind: z.literal("POINT"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
})

export const TextboxPositionDataSchema = z.object({
  kind: z.literal("TEXT_BOX"),
  pageNumber: z.number(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().optional(),
})

const RectPositionDataSchema = z.object({
  kind: z.literal("RECT"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  strokeWidth: z.number().optional(),
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
})

const PathPositionDataSchema = z.object({
  kind: z.literal("PATH"),
  pageNumber: z.number().int().positive(),
  points: z
    .array(
      z.object({
        x: z.number(),
        y: z.number(),
        pressure: z.number().optional(),
      })
    )
    .min(2),
  strokeWidth: z.number(),
  style: z.enum(["pen", "highlighter"]).optional(),
  opacity: z.number().optional(),
})

const ArrowPositionDataSchema = z.object({
  kind: z.literal("ARROW"),
  pageNumber: z.number().int().positive(),
  from: z.object({ x: z.number(), y: z.number() }),
  to: z.object({ x: z.number(), y: z.number() }),
  strokeWidth: z.number(),
  opacity: z.number().optional(),
})

const SignaturePositionDataSchema = z.object({
  kind: z.literal("SIGNATURE"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  data: z.string(), // Base64 or SVG path
  rotation: z.number().optional(),
  opacity: z.number().optional(),
})

const ImagePositionDataSchema = z.object({
  kind: z.literal("IMAGE"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  url: z.string().url(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
})

const CloudPositionDataSchema = z.object({
  kind: z.literal("CLOUD"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional(),
  opacity: z.number().optional(),
  strokeWidth: z.number().optional(),
  fillColor: z.string().optional(),
  strokeColor: z.string().optional(),
})

export const PositionDataSchema = z.discriminatedUnion("kind", [
  TextPositionDataSchema,
  PointPositionDataSchema,
  TextboxPositionDataSchema,
  RectPositionDataSchema,
  PathPositionDataSchema,
  ArrowPositionDataSchema,
  SignaturePositionDataSchema,
  ImagePositionDataSchema,
  CloudPositionDataSchema,
])

// ─── Annotation type enum ──────────────────────────────────────────────────────
export const AnnotationTypeSchema = z.enum([
  "HIGHLIGHT",
  "UNDERLINE",
  "STRIKETHROUGH",
  "SQUIGGLY",
  "NOTE",
  "FREEHAND",
  "RECTANGLE",
  "CIRCLE",
  "ARROW",
  "TEXTBOX",
  "IMAGE_SHAPE",
  "SIGNATURE",
  "REDACTION",
  "CHECKMARK",
  "CROSS",
  "LINE",
  "STAMP",
  "CLOUD",
])

export const AnnotationStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
])

// ─── Create annotation ─────────────────────────────────────────────────────────
export const CreateAnnotationSchema = z.object({
  clientId: z.string().uuid().optional(), // For idempotent upserts
  pageNumber: z.number().int().positive(),
  type: AnnotationTypeSchema,
  status: AnnotationStatusSchema.optional(),
  assigneeId: z.string().cuid().nullable().optional(),
  color: hexColor,
  positionData: PositionDataSchema,
  content: z.string().max(10_000).optional(),
})

export type CreateAnnotationInput = z.infer<typeof CreateAnnotationSchema>

// ─── Update annotation (only updatable fields) ────────────────────────────────
export const UpdateAnnotationSchema = z
  .object({
    content: z.string().max(10_000),
    color: hexColor,
    positionData: PositionDataSchema,
    status: AnnotationStatusSchema,
    assigneeId: z.string().cuid().nullable(),
    updatedAt: z.string().datetime(), // For staleness detection (409 conflict)
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })

export type UpdateAnnotationInput = z.infer<typeof UpdateAnnotationSchema>

// ─── Add tag ─────────────────────────────────────────────────────────────────
export const AddTagSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Tag label is required")
    .max(50, "Tag label too long"),
})

export type AddTagInput = z.infer<typeof AddTagSchema>

// ─── Bulk Sync Schema ─────────────────────────────────────────────────────────

export const SyncOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("create"),
    clientId: z.string().uuid(),
    payload: CreateAnnotationSchema,
  }),
  z.object({
    type: z.literal("update"),
    id: z.string(),
    payload: UpdateAnnotationSchema,
  }),
  z.object({
    type: z.literal("delete"),
    id: z.string(),
  }),
  z.object({
    type: z.literal("restore"),
    id: z.string(),
  }),
])

export const BulkSyncSchema = z.object({
  documentId: z.string().uuid(),
  operations: z.array(SyncOperationSchema).min(1).max(100),
})

export type SyncOperationInput = z.infer<typeof SyncOperationSchema>
export type BulkSyncInput = z.infer<typeof BulkSyncSchema>

