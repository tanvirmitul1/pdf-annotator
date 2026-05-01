import type { 
  AnnotationWithTags, 
  PositionData, 
  TextAnchor 
} from "@/features/annotations/types"
import type { ResizeHandle } from "@/features/annotations/geometry"

export interface AnnotationOverlayProps {
  documentId: string
  pageNumber: number
  zoom: number
  rotation: 0 | 90 | 180 | 270
  srcW: number
  srcH: number
  screenW: number
  screenH: number
  textLayerGenerationKey: string
  textLayerReadyKey: string | null
}

export interface ResolvedAnnotationMeta {
  positionData: PositionData
  orphaned: boolean
}

export interface ManipulationState {
  annotation: AnnotationWithTags
  mode: "move" | "resize"
  handle?: ResizeHandle
  startSrc: { x: number; y: number }
  startClient: { x: number; y: number }
  originalPosition: PositionData
  centerSrc?: { x: number; y: number }
  originalRotation?: number
}

export interface SelectionInfo {
  anchor: TextAnchor
  pos: { x: number; y: number }
}

export interface DrawRect {
  x: number
  y: number
  w: number
  h: number
}

export interface ArrowDraw {
  from: { x: number; y: number }
  to: { x: number; y: number }
}

export interface ContextMenuState {
  annotation: AnnotationWithTags
  x: number
  y: number
}
