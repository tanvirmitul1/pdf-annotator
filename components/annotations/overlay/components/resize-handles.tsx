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

  if (positionData.kind === "RECT" || positionData.kind === "TEXT_BOX" || positionData.kind === "CLOUD" || positionData.kind === "TEXT") {
    let minX = 0, minY = 0, maxX = 0, maxY = 0
    
    if (positionData.kind === "TEXT") {
      const rects = positionData.anchor.rects
      if (rects.length === 0) return null
      minX = Math.min(...rects.map(r => r.x))
      maxX = Math.max(...rects.map(r => r.x + r.width))
      minY = Math.min(...rects.map(r => r.y))
      maxY = Math.max(...rects.map(r => r.y + r.height))
    } else {
      minX = positionData.x
      maxX = positionData.x + positionData.width
      minY = positionData.y
      maxY = positionData.y + positionData.height
    }

    const topLeft = srcToScreen(minX, minY, srcW, srcH, zoom, rotation)
    const bottomRight = srcToScreen(maxX, maxY, srcW, srcH, zoom, rotation)
    
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
        {/* Rotation handle with connector line */}
        <line
          x1={(x1 + x2) / 2} y1={y1}
          x2={(x1 + x2) / 2} y2={y1 - 20}
          stroke={annotation.color}
          strokeWidth={1}
          strokeDasharray="3 2"
          style={{ pointerEvents: "none" }}
        />
        <g
          data-annotation-handle="true"
          style={{ cursor: "grab", pointerEvents: "auto" }}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.setPointerCapture(event.pointerId)
            onBeginManipulation(annotation, "resize", event.clientX, event.clientY, "rot")
          }}
        >
          {/* Invisible hit area */}
          <circle
            cx={(x1 + x2) / 2}
            cy={y1 - 24}
            r={handleRadius + 4}
            fill="transparent"
            stroke="none"
          />
          {/* Rotation arrow icon */}
          <path
            d={`M ${(x1 + x2) / 2 - 4} ${y1 - 27} A 5 5 0 1 1 ${(x1 + x2) / 2 + 4} ${y1 - 27}`}
            fill="none"
            stroke={annotation.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d={`M ${(x1 + x2) / 2 + 2} ${y1 - 30} L ${(x1 + x2) / 2 + 5} ${y1 - 27} L ${(x1 + x2) / 2 + 2} ${y1 - 24}`}
            fill="none"
            stroke={annotation.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
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
        <line
          x1={(x1 + x2) / 2} y1={y1}
          x2={(x1 + x2) / 2} y2={y1 - 20}
          stroke={annotation.color}
          strokeWidth={1}
          strokeDasharray="3 2"
          style={{ pointerEvents: "none" }}
        />
        <g
          data-annotation-handle="true"
          style={{ cursor: "grab", pointerEvents: "auto" }}
          onPointerDown={(event) => {
            event.preventDefault()
            event.stopPropagation()
            event.currentTarget.setPointerCapture(event.pointerId)
            onBeginManipulation(annotation, "resize", event.clientX, event.clientY, "rot")
          }}
        >
          <circle
            cx={(x1 + x2) / 2}
            cy={y1 - 24}
            r={handleRadius + 4}
            fill="transparent"
            stroke="none"
          />
          <path
            d={`M ${(x1 + x2) / 2 - 4} ${y1 - 27} A 5 5 0 1 1 ${(x1 + x2) / 2 + 4} ${y1 - 27}`}
            fill="none"
            stroke={annotation.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <path
            d={`M ${(x1 + x2) / 2 + 2} ${y1 - 30} L ${(x1 + x2) / 2 + 5} ${y1 - 27} L ${(x1 + x2) / 2 + 2} ${y1 - 24}`}
            fill="none"
            stroke={annotation.color}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
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
