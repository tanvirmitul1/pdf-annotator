// ─── Tool IDs ────────────────────────────────────────────────────────────────

export type ToolId =
  | "select"
  | "highlight"
  | "underline"
  | "strikethrough"
  | "squiggly"
  | "note"
  | "freehand"
  | "rectangle"
  | "circle"
  | "arrow"
  | "textbox"
  | "eraser"

// ─── Annotation types (mirrors Prisma AnnotationType enum) ───────────────────

export type AnnotationType =
  | "HIGHLIGHT"
  | "UNDERLINE"
  | "STRIKETHROUGH"
  | "SQUIGGLY"
  | "NOTE"
  | "FREEHAND"
  | "RECTANGLE"
  | "CIRCLE"
  | "ARROW"
  | "TEXTBOX"

/** Map from tool ID to the annotation type it creates */
export const TOOL_TO_TYPE: Partial<Record<ToolId, AnnotationType>> = {
  highlight: "HIGHLIGHT",
  underline: "UNDERLINE",
  strikethrough: "STRIKETHROUGH",
  squiggly: "SQUIGGLY",
  note: "NOTE",
  freehand: "FREEHAND",
  rectangle: "RECTANGLE",
  circle: "CIRCLE",
  arrow: "ARROW",
  textbox: "TEXTBOX",
}

// ─── Annotation color presets ────────────────────────────────────────────────

export const ANNOTATION_COLORS = [
  { id: "yellow", hex: "#fbbf24", label: "Yellow" },
  { id: "green", hex: "#4ade80", label: "Green" },
  { id: "blue", hex: "#60a5fa", label: "Blue" },
  { id: "pink", hex: "#f472b6", label: "Pink" },
] as const

export type AnnotationColorId = (typeof ANNOTATION_COLORS)[number]["id"]
export const DEFAULT_ANNOTATION_COLOR = ANNOTATION_COLORS[0].hex

export const SHAPE_THICKNESS_OPTIONS = [1, 2, 4] as const
export type ShapeThickness = (typeof SHAPE_THICKNESS_OPTIONS)[number]
export const DEFAULT_THICKNESS: ShapeThickness = 2

// ─── Position data types (per ANNOTATIONS.md) ────────────────────────────────

export interface TextRect {
  x: number
  y: number
  width: number
  height: number
}

export interface TextAnchor {
  rects: TextRect[]
  quotedText: string
  prefix: string
  suffix: string
}

export interface PositionDataBase {
  pageNumber: number
}

export interface TextPositionData extends PositionDataBase {
  kind: "TEXT"
  anchor: TextAnchor
}

export interface PointPositionData extends PositionDataBase {
  kind: "POINT"
  x: number
  y: number
}

export interface RectPositionData extends PositionDataBase {
  kind: "RECT"
  x: number
  y: number
  width: number
  height: number
  rotation?: number
}

export interface PathPositionData extends PositionDataBase {
  kind: "PATH"
  points: Array<{ x: number; y: number; pressure?: number }>
  strokeWidth: number
}

export interface ArrowPositionData extends PositionDataBase {
  kind: "ARROW"
  from: { x: number; y: number }
  to: { x: number; y: number }
  strokeWidth: number
}

export type PositionData =
  | TextPositionData
  | PointPositionData
  | RectPositionData
  | PathPositionData
  | ArrowPositionData

// ─── Tag ─────────────────────────────────────────────────────────────────────

export interface TagSummary {
  id: string
  label: string
  color: string | null
}

// ─── Full annotation with tags ────────────────────────────────────────────────

export interface AnnotationWithTags {
  id: string
  userId: string
  documentId: string
  pageNumber: number
  type: AnnotationType
  color: string
  positionData: PositionData
  content: string | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
  tags: TagSummary[]
}

// ─── Draft annotation (in-progress creation) ────────────────────────────────

export interface AnnotationDraft {
  type: ToolId
  color: string
  pageNumber?: number
  positionData?: Partial<PositionData>
  content?: string
}

// ─── Undo/redo ───────────────────────────────────────────────────────────────

export type UndoAction = "create" | "update" | "delete"

export interface UndoEntry {
  action: UndoAction
  before: AnnotationWithTags | null
  after: AnnotationWithTags | null
}

export const MAX_UNDO_STACK = 50

// ─── Save status ──────────────────────────────────────────────────────────────

export type SaveStatus = "idle" | "saving" | "saved" | "offline"

// ─── Coordinate transform helpers ────────────────────────────────────────────

/**
 * Transform a source-space point (PDF coords, rotation=0, zoom=1)
 * to screen-space pixel coordinates, accounting for zoom and rotation.
 *
 * srcW / srcH are the page dimensions at rotation=0, zoom=1 (PDF points).
 */
export function srcToScreen(
  sx: number,
  sy: number,
  srcW: number,
  srcH: number,
  zoom: number,
  rotation: 0 | 90 | 180 | 270
): { x: number; y: number } {
  switch (rotation) {
    case 0:
      return { x: sx * zoom, y: sy * zoom }
    case 90:
      // 90° CW: (sx, sy) → (srcH - sy, sx)
      return { x: (srcH - sy) * zoom, y: sx * zoom }
    case 180:
      return { x: (srcW - sx) * zoom, y: (srcH - sy) * zoom }
    case 270:
      // 270° CW (= 90° CCW): (sx, sy) → (sy, srcW - sx)
      return { x: sy * zoom, y: (srcW - sx) * zoom }
  }
}

/**
 * Transform screen-space pixel coordinates back to source-space PDF coords.
 */
export function screenToSrc(
  px: number,
  py: number,
  srcW: number,
  srcH: number,
  zoom: number,
  rotation: 0 | 90 | 180 | 270
): { x: number; y: number } {
  const sx = px / zoom
  const sy = py / zoom
  switch (rotation) {
    case 0:
      return { x: sx, y: sy }
    case 90:
      // inverse of (srcH - sy, sx): x=srcH-sy → sy=srcH-x; y=sx → x=y
      return { x: sy, y: srcH - sx }
    case 180:
      return { x: srcW - sx, y: srcH - sy }
    case 270:
      // inverse of (sy, srcW-sx): x=sy→sx=y; y=srcW-sx→sx=srcW-y
      return { x: srcW - sy, y: sx }
  }
}
