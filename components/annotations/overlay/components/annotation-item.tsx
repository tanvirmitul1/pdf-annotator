"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { srcToScreen } from "@/features/annotations/types"
import type { 
  AnnotationWithTags, 
  PositionData 
} from "@/features/annotations/types"
import { generateCloudPath } from "../utils"
import { SquigglyLine } from "./squiggly-line"
import { ResizeHandles } from "./resize-handles"
import type { ResizeHandle } from "@/features/annotations/geometry"

interface AnnotationItemProps {
  annotation: AnnotationWithTags
  resolvedPosition: PositionData
  isSelected: boolean
  isHovered: boolean
  isEraser: boolean
  ringColor: string
  opacity: number
  zoom: number
  rotation: 0 | 90 | 180 | 270
  srcW: number
  srcH: number
  activeTool: string
  selectedAnnotationId: string | null
  canEdit: boolean
  handleRadius: number
  textboxPadding: number
  draftId: string | null
  onMouseEnter: (event: React.MouseEvent) => void
  onMouseLeave: () => void
  onFocus: (event: React.FocusEvent) => void
  onBlur: () => void
  onClick: (event: React.MouseEvent) => void
  onDoubleClick: (event: React.MouseEvent) => void
  onPointerDown: (event: React.PointerEvent) => void
  onBeginManipulation: (
    annotation: AnnotationWithTags,
    mode: "move" | "resize",
    clientX: number,
    clientY: number,
    handle?: ResizeHandle
  ) => void
}

export function AnnotationItem({
  annotation,
  resolvedPosition,
  isSelected,
  isHovered,
  isEraser,
  ringColor,
  opacity,
  zoom,
  rotation,
  srcW,
  srcH,
  activeTool,
  selectedAnnotationId,
  canEdit,
  handleRadius,
  textboxPadding,
  draftId,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  onClick,
  onDoubleClick,
  onPointerDown,
  onBeginManipulation,
}: AnnotationItemProps) {
  const sharedProps = {
    "data-annotation": annotation.id,
    role: "button",
    tabIndex: 0,
    "aria-label": `${annotation.type.toLowerCase()} annotation`,
    className: cn(
      "cursor-pointer transition-opacity duration-100",
      isHovered && "opacity-80"
    ),
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    onClick,
    onDoubleClick,
    onPointerDown,
  }

  if (resolvedPosition.kind === "TEXT") {
    return (
      <g key={annotation.id} {...sharedProps}>
        {resolvedPosition.anchor.rects.map((rect, index) => {
          const topLeft = srcToScreen(rect.x, rect.y, srcW, srcH, zoom, rotation)
          const bottomRight = srcToScreen(
            rect.x + rect.width,
            rect.y + rect.height,
            srcW,
            srcH,
            zoom,
            rotation
          )

          const x = Math.min(topLeft.x, bottomRight.x)
          const y = Math.min(topLeft.y, bottomRight.y)
          const width = Math.abs(bottomRight.x - topLeft.x)
          const height = Math.abs(bottomRight.y - topLeft.y)

          if (annotation.type === "HIGHLIGHT") {
            return (
              <rect
                key={index}
                x={x}
                y={y}
                width={width}
                height={height}
                fill={annotation.color}
                opacity={isHovered ? 0.4 : 0.28}
                style={{ mixBlendMode: "multiply" }}
              />
            )
          }

          if (annotation.type === "UNDERLINE") {
            return (
              <line
                key={index}
                x1={x}
                y1={y + height}
                x2={x + width}
                y2={y + height}
                stroke={annotation.color}
                strokeWidth={1.5}
                opacity={opacity}
              />
            )
          }

          if (annotation.type === "STRIKETHROUGH") {
            return (
              <line
                key={index}
                x1={x}
                y1={y + height / 2}
                x2={x + width}
                y2={y + height / 2}
                stroke={annotation.color}
                strokeWidth={1.5}
                opacity={opacity}
              />
            )
          }

          if (annotation.type === "SQUIGGLY") {
            return (
              <SquigglyLine
                key={index}
                x={x}
                y={y + height}
                width={width}
                color={annotation.color}
                amplitude={1.5}
              />
            )
          }

          return null
        })}
      </g>
    )
  }

  if (resolvedPosition.kind === "POINT") {
    const point = srcToScreen(
      resolvedPosition.x,
      resolvedPosition.y,
      srcW,
      srcH,
      zoom,
      rotation
    )

    return (
      <g key={annotation.id} {...sharedProps}>
        <circle
          cx={point.x}
          cy={point.y}
          r={isHovered ? 10 : 8}
          fill={annotation.color}
          fillOpacity={0.9}
        />
        {isSelected || isHovered ? (
          <circle
            cx={point.x}
            cy={point.y}
            r={isHovered ? 14 : 12}
            fill="none"
            stroke={ringColor}
            strokeWidth={2}
            strokeOpacity={isSelected ? 0.95 : 0.7}
          />
        ) : null}
      </g>
    )
  }

  if (resolvedPosition.kind === "RECT" || resolvedPosition.kind === "TEXT_BOX" || resolvedPosition.kind === "CLOUD") {
    const topLeft = srcToScreen(
      resolvedPosition.x,
      resolvedPosition.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const bottomRight = srcToScreen(
      resolvedPosition.x + (resolvedPosition as any).width,
      resolvedPosition.y + (resolvedPosition as any).height,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const x = Math.min(topLeft.x, bottomRight.x)
    const y = Math.min(topLeft.y, bottomRight.y)
    const width = Math.abs(bottomRight.x - topLeft.x)
    const height = Math.abs(bottomRight.y - topLeft.y)
    const centerX = x + width / 2
    const centerY = y + height / 2

    return (
      <g 
        key={annotation.id} 
        {...sharedProps}
        transform={`rotate(${resolvedPosition.rotation || 0} ${centerX} ${centerY})`}
      >
        {annotation.type === "CLOUD" ? (
           <path
             d={generateCloudPath(x, y, width, height, 8 * zoom)}
             fill={annotation.color}
             fillOpacity={0.12}
             stroke={annotation.color}
             strokeWidth={isHovered ? 2.5 * zoom : 2 * zoom}
             opacity={opacity}
           />
        ) : annotation.type === "CIRCLE" ? (
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={width / 2}
            ry={height / 2}
            fill={annotation.color}
            fillOpacity={0.12}
            stroke={annotation.color}
            strokeWidth={isHovered ? 2.5 * zoom : 2 * zoom}
            opacity={opacity}
          />
        ) : (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={annotation.color}
            fillOpacity={annotation.type === "TEXTBOX" ? 0.08 : 0.1}
            stroke={annotation.color}
            strokeWidth={isHovered ? 2.5 * zoom : 2 * zoom}
            rx={annotation.type === "TEXTBOX" ? 4 : 2}
            opacity={opacity}
          />
        )}
        {isSelected || isHovered ? (
          <rect
            x={x - 3}
            y={y - 3}
            width={width + 6}
            height={height + 6}
            fill="none"
            stroke={ringColor}
            strokeWidth={2}
            rx={6}
            strokeOpacity={isSelected ? 0.95 : 0.7}
          />
        ) : null}
        {annotation.type === "TEXTBOX" && resolvedPosition.kind === "TEXT_BOX" && draftId !== annotation.id ? (
          <foreignObject
            x={x + textboxPadding}
            y={y + textboxPadding}
            width={Math.max(width - textboxPadding * 2, 1)}
            height={Math.max(height - textboxPadding * 2, 1)}
            style={{ pointerEvents: activeTool === "select" ? "auto" : "none" }}
          >
            <div
              className={cn(
                "h-full w-full overflow-hidden leading-tight break-words whitespace-pre-wrap",
                resolvedPosition.fontFamily
              )}
              style={{ 
                color: annotation.color,
                fontSize: resolvedPosition.fontSize ? `${resolvedPosition.fontSize * zoom}px` : undefined,
                textAlign: resolvedPosition.textAlign ?? "left",
                opacity: resolvedPosition.opacity ?? 1,
                overflowWrap: "anywhere",
              }}
            >
              {annotation.content}
            </div>
          </foreignObject>
        ) : null}
        {renderResizeHandles(annotation, resolvedPosition)}
      </g>
    )
  }

  if (resolvedPosition.kind === "PATH") {
    if (resolvedPosition.points.length < 2) return null
    const pathData = resolvedPosition.points
      .map((point, index) => {
        const screenPoint = srcToScreen(point.x, point.y, srcW, srcH, zoom, rotation)
        return `${index === 0 ? "M" : "L"} ${screenPoint.x} ${screenPoint.y}`
      })
      .join(" ")

    const isHighlighterStroke = (resolvedPosition as any).style === "highlighter"

    return (
      <g key={annotation.id} {...sharedProps}>
        {isSelected || isHovered ? (
          <path
            d={pathData}
            fill="none"
            stroke={ringColor}
            strokeWidth={Math.max(
              isHighlighterStroke ? 10 : 4,
              resolvedPosition.strokeWidth * zoom + (isHighlighterStroke ? 5 : 3)
            )}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={isSelected ? 0.35 : 0.2}
          />
        ) : null}
        <path
          d={pathData}
          fill="none"
          stroke={annotation.color}
          strokeWidth={resolvedPosition.strokeWidth * zoom}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isHighlighterStroke ? 0.28 : opacity}
          style={isHighlighterStroke ? { mixBlendMode: "multiply" } : undefined}
        />
      </g>
    )
  }

  if (resolvedPosition.kind === "ARROW") {
    const from = srcToScreen(resolvedPosition.from.x, resolvedPosition.from.y, srcW, srcH, zoom, rotation)
    const to = srcToScreen(resolvedPosition.to.x, resolvedPosition.to.y, srcW, srcH, zoom, rotation)
    const markerId = `arrow-${annotation.id}`

    return (
      <g key={annotation.id} {...sharedProps}>
        <defs>
          <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill={annotation.color} />
          </marker>
        </defs>
        <line
          x1={from.x} y1={from.y} x2={to.x} y2={to.y}
          stroke={annotation.color}
          strokeWidth={resolvedPosition.strokeWidth * zoom}
          strokeLinecap="round"
          markerEnd={annotation.type === "ARROW" ? `url(#${markerId})` : undefined}
          opacity={opacity}
        />
        {isSelected || isHovered ? (
          <line
            x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke={ringColor}
            strokeWidth={Math.max(4, resolvedPosition.strokeWidth * zoom + 3)}
            strokeLinecap="round"
            strokeOpacity={isSelected ? 0.35 : 0.2}
          />
        ) : null}
        {renderResizeHandles(annotation, resolvedPosition)}
      </g>
    )
  }

  if (resolvedPosition.kind === "IMAGE" || resolvedPosition.kind === "SIGNATURE") {
    const x = resolvedPosition.x * zoom
    const y = resolvedPosition.y * zoom
    const width = resolvedPosition.width * zoom
    const height = resolvedPosition.height * zoom

    return (
      <g 
        key={annotation.id} 
        {...sharedProps}
        transform={`rotate(${(resolvedPosition as any).rotation || 0} ${x + width / 2} ${y + height / 2})`}
      >
        {resolvedPosition.kind === "IMAGE" ? (
          <image
            href={resolvedPosition.url}
            x={x} y={y} width={width} height={height}
            opacity={opacity}
          />
        ) : (
          <path
            d={(resolvedPosition as any).data}
            fill={annotation.color}
            opacity={opacity}
            transform={`translate(${x}, ${y}) scale(${width / 100}, ${height / 100})`}
          />
        )}
        {isSelected || isHovered ? (
          <rect
            x={x - 2} y={y - 2} width={width + 4} height={height + 4}
            fill="none" stroke={ringColor} strokeWidth={2} rx={4}
          />
        ) : null}
        {renderResizeHandles(annotation, resolvedPosition)}
      </g>
    )
  }

  return null

  function renderResizeHandles(ann: AnnotationWithTags, pos: PositionData) {
    return (
      <ResizeHandles
        annotation={ann}
        positionData={pos}
        activeTool={activeTool}
        selectedAnnotationId={selectedAnnotationId}
        zoom={zoom}
        rotation={rotation}
        srcW={srcW}
        srcH={srcH}
        handleRadius={handleRadius}
        onBeginManipulation={onBeginManipulation}
      />
    )
  }
}
