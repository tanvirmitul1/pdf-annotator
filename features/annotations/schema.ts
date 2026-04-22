import { z } from "zod"

// ─── Hex color validator ──────────────────────────────────────────────────────
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")

// ─── Position data sub-schemas ────────────────────────────────────────────────
const TextRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
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

const RectPositionDataSchema = z.object({
  kind: z.literal("RECT"),
  pageNumber: z.number().int().positive(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  rotation: z.number().optional(),
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
  strokeWidth: z.number().positive(),
})

const ArrowPositionDataSchema = z.object({
  kind: z.literal("ARROW"),
  pageNumber: z.number().int().positive(),
  from: z.object({ x: z.number(), y: z.number() }),
  to: z.object({ x: z.number(), y: z.number() }),
  strokeWidth: z.number().positive(),
})

export const PositionDataSchema = z.discriminatedUnion("kind", [
  TextPositionDataSchema,
  PointPositionDataSchema,
  RectPositionDataSchema,
  PathPositionDataSchema,
  ArrowPositionDataSchema,
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
])

// ─── Create annotation ─────────────────────────────────────────────────────────
export const CreateAnnotationSchema = z.object({
  pageNumber: z.number().int().positive(),
  type: AnnotationTypeSchema,
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
