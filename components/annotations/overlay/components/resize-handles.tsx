"use client"

import { srcToScreen } from "@/features/annotations/types"
import type { 
  AnnotationWithTags, 
  PositionData 
} from "@/features/annotations/types"
import { isResizablePosition, type ResizeHandle } from "@/features/annotations/geometry"

interface ResizeHandlesProps {
  annotation: AnnotationWithTags
  positionData: PositionData
  activeTool: string
  selectedAnnotationId: string | null
  zoom: number
  rotation: 0 | 90 | 180 | 270
  srcW: number
  srcH: number
  handleRadius: number
  onBeginManipulation: (
    annotation: AnnotationWithTags,
    mode: "move" | "resize",
    clientX: number,
    clientY: number,
    handle?: ResizeHandle
  ) => void
}

export function ResizeHandles({
  annotation,
  positionData,
  activeTool,
  selectedAnnotationId,
  zoom,
  rotation,
  srcW,
  srcH,
  handleRadius,
  onBeginManipulation,
}: ResizeHandlesProps) {
  if (activeTool !== "select" || annotation.id !== selectedAnnotationId) {
    return null
  }

  if (!isResizablePosition(positionData)) {
    return null
  }

  const handleProps = (
    handle: ResizeHandle,
    x: number,
    y: number,
    cursorStyle: string
  ) => (
    <circle
      key={handle}
      cx={x}
      cy={y}
      r={handleRadius}
      data-annotation-handle="true"
      fill="hsl(var(--background))"
      stroke={annotation.color}
      strokeWidth={2}
      style={{ cursor: cursorStyle, pointerEvents: "auto" }}
      onPointerDown={(event) => {
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.setPointerCapture(event.pointerId)
        onBeginManipulation(
          annotation,
          "resize",
          event.clientX,
          event.clientY,
          handle
        )
      }}
    />
  )

  if (positionData.kind === "RECT" || positionData.kind === "TEXT_BOX" || positionData.kind === "CLOUD") {
    const topLeft = srcToScreen(
      positionData.x,
      positionData.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const bottomRight = srcToScreen(
      positionData.x + (positionData as any).width,
      positionData.y + (positionData as any).height,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const x1 = Math.min(topLeft.x, bottomRight.x)
    const y1 = Math.min(topLeft.y, bottomRight.y)
    const x2 = Math.max(topLeft.x, bottomRight.x)
    const y2 = Math.max(topLeft.y, bottomRight.y)

    return (
      <g>
        {handleProps("nw", x1, y1, "nwse-resize")}
        {handleProps("ne", x2, y1, "nesw-resize")}
        {handleProps("sw", x1, y2, "nesw-resize")}
        {handleProps("se", x2, y2, "nwse-resize")}
        {handleProps("rot", (x1 + x2) / 2, y1 - 24, "crosshair")}
      </g>
    )
  }

  if (positionData.kind === "SIGNATURE" || positionData.kind === "IMAGE") {
    const x1 = positionData.x * zoom
    const y1 = positionData.y * zoom
    const x2 = (positionData.x + positionData.width) * zoom
    const y2 = (positionData.y + positionData.height) * zoom

    return (
      <g>
        {handleProps("nw", x1, y1, "nwse-resize")}
        {handleProps("ne", x2, y1, "nesw-resize")}
        {handleProps("sw", x1, y2, "nesw-resize")}
        {handleProps("se", x2, y2, "nwse-resize")}
        {handleProps("rot", (x1 + x2) / 2, y1 - 24, "crosshair")}
      </g>
    )
  }

  if (positionData.kind === "ARROW") {
    const from = srcToScreen(
      positionData.from.x,
      positionData.from.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const to = srcToScreen(
      positionData.to.x,
      positionData.to.y,
      srcW,
      srcH,
      zoom,
      rotation
    )

    return (
      <g>
        {handleProps("start", from.x, from.y, "grab")}
        {handleProps("end", to.x, to.y, "grab")}
      </g>
    )
  }

  return null
}
