"use client"

import { AlertTriangle } from "lucide-react"
import { srcToScreen } from "@/features/annotations/types"
import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"

import { AnnotationHoverCard } from "./annotation-hover-card"
import { InlineToolbar } from "./inline-toolbar"
import { SelectionMenu } from "./selection-menu"

import { useOverlayLogic } from "./overlay/use-overlay-logic"
import { AnnotationItem } from "./overlay/components/annotation-item"
import type { AnnotationOverlayProps } from "./overlay/types"

const HANDLE_RADIUS = 6
const TEXTBOX_PADDING = 8

export function AnnotationOverlay(props: AnnotationOverlayProps) {
  const { 
    documentId, 
    pageNumber, 
    zoom, 
    rotation, 
    srcW, 
    srcH, 
    screenW, 
    screenH 
  } = props

  const logic = useOverlayLogic(props)
  
  const {
    overlayRef,
    pageAnnotations,
    resolvedMap,
    hoverPos,
    hoveredAnnotation,
    selectionInfo,
    drawRect,
    drawPath,
    arrowDraw,
    contextMenu,
    activeTool,
    selectedColor,
    selectedAnnotationId,
    draft,
    coarsePointer,
    setSelectionInfo,
    setContextMenu,
    handlePointerMove,
    handlePointerDown,
    handlePointerUp,
    handleAnnotationActivate,
    beginManipulation,
    discardDraft,
    canEditAnnotation,
    setSelectedColor,
    deleteAnnotationImmediate,
    updateAnnotation,
    openAnnotation,
    addAnnotation,
    isDrawingMode,
    isDrawing,
    isManipulating,
    livePositions,
    toolThickness,
  } = logic

  const ringColor = "hsl(var(--primary))"

  return (
    <div
      ref={overlayRef}
      className={cn(
        "absolute inset-0 z-10 overflow-visible touch-none",
        isDrawingMode || isDrawing || isManipulating ? "pointer-events-auto" : "pointer-events-none",
        activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : 
        activeTool === "select" ? "cursor-default" : 
        activeTool === "eraser" ? "cursor-crosshair" : "cursor-crosshair"
      )}
      onPointerMove={handlePointerMove}
      onPointerDown={(e) => {
        if (isDrawingMode || isManipulating) {
          e.currentTarget.setPointerCapture(e.pointerId)
        }
        handlePointerDown(e)
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        handlePointerUp(e)
      }}
    >
      <svg
        className="pointer-events-none absolute inset-0 overflow-visible"
        width={screenW}
        height={screenH}
        viewBox={`0 0 ${screenW} ${screenH}`}
      >
        {pageAnnotations.map((annotation) => {
          const resolved = resolvedMap[annotation.id]
          if (!resolved) return null

          const isSelected = selectedAnnotationId === annotation.id
          const isHovered = !coarsePointer && hoveredAnnotation?.id === annotation.id
          const isEraser = activeTool === "eraser"
          
          const effectivePosition = livePositions[annotation.id] ?? resolved.positionData

          return (
            <AnnotationItem
              key={annotation.id}
              annotation={annotation}
              resolvedPosition={effectivePosition}
              isSelected={isSelected}
              isHovered={isHovered}
              isEraser={isEraser}
              ringColor={ringColor}
              opacity={effectivePosition.kind === "TEXT" ? 1 : (effectivePosition as any).opacity ?? 1}
              zoom={zoom}
              rotation={rotation}
              srcW={srcW}
              srcH={srcH}
              activeTool={activeTool}
              selectedAnnotationId={selectedAnnotationId}
              canEdit={canEditAnnotation(annotation)}
              handleRadius={HANDLE_RADIUS}
              textboxPadding={TEXTBOX_PADDING}
              draftId={draft?.id ?? null}
              onMouseEnter={() => {}} 
              onMouseLeave={() => {}} 
              onFocus={() => {}}
              onBlur={() => {}}
              onClick={(e) => {
                if (activeTool === "select" || activeTool === "hand") {
                  e.stopPropagation()
                  handleAnnotationActivate(annotation)
                }
              }}
              onDoubleClick={(e) => {
                if (activeTool === "select" && annotation.type === "TEXTBOX") {
                  e.stopPropagation()
                  // Enter edit mode
                }
              }}
              onPointerDown={(e) => {
                if (activeTool === "select" || activeTool === "hand") {
                  e.stopPropagation()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  beginManipulation(annotation, "move", e.clientX, e.clientY)
                }
              }}
              onBeginManipulation={beginManipulation}
            />
          )
        })}

        {/* Orphans Warning */}
        {pageAnnotations.some(a => resolvedMap[a.id]?.orphaned) && (
          <g transform={`translate(${screenW - 40}, 20)`}>
            <circle r="12" fill="hsl(var(--destructive))" opacity="0.2" />
            <AlertTriangle className="size-4 -translate-x-2 -translate-y-2 text-destructive" />
          </g>
        )}

        {/* Drawing Previews */}
        {drawRect && (
          <rect
            x={srcToScreen(drawRect.x, 0, srcW, srcH, zoom, rotation).x}
            y={srcToScreen(0, drawRect.y, srcW, srcH, zoom, rotation).y}
            width={drawRect.w * zoom}
            height={drawRect.h * zoom}
            fill={activeTool === "redact" ? "black" : "transparent"}
            stroke={activeTool === "redact" ? "black" : "hsl(var(--primary))"}
            strokeWidth={2}
            strokeDasharray={activeTool === "redact" ? undefined : "4 2"}
          />
        )}

        {drawPath.length > 1 && (
          <path
            d={drawPath.map((p, i) => {
              const s = srcToScreen(p.x, p.y, srcW, srcH, zoom, rotation)
              return `${i === 0 ? "M" : "L"} ${s.x} ${s.y}`
            }).join(" ")}
            fill="none"
            stroke={selectedColor as string}
            strokeWidth={Math.max(2, toolThickness * zoom)}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={activeTool === "freehandHighlight" ? 0.35 : 1}
            style={activeTool === "freehandHighlight" ? { mixBlendMode: "multiply" } : undefined}
          />
        )}

        {arrowDraw && (
          <line
            x1={srcToScreen(arrowDraw.from.x, arrowDraw.from.y, srcW, srcH, zoom, rotation).x}
            y1={srcToScreen(arrowDraw.from.x, arrowDraw.from.y, srcW, srcH, zoom, rotation).y}
            x2={srcToScreen(arrowDraw.to.x, arrowDraw.to.y, srcW, srcH, zoom, rotation).x}
            y2={srcToScreen(arrowDraw.to.x, arrowDraw.to.y, srcW, srcH, zoom, rotation).y}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
        )}
      </svg>

      {/* Floating Menus */}
      {hoveredAnnotation && hoverPos && (
        <AnnotationHoverCard
          annotation={hoveredAnnotation}
          position={hoverPos}
        />
      )}

      {selectionInfo && (
        <SelectionMenu
          position={selectionInfo.pos}
          selectedColor={selectedColor as string}
          onApply={(type) => {
            addAnnotation({
              documentId,
              pageNumber,
              type,
              color: selectedColor as string,
              positionData: {
                kind: "TEXT",
                pageNumber,
                anchor: selectionInfo.anchor,
              },
            })
            window.getSelection()?.removeAllRanges()
            setSelectionInfo(null)
          }}
          onColorSelect={setSelectedColor}
          onComment={() => {
            addAnnotation({
              documentId,
              pageNumber,
              type: "NOTE",
              color: selectedColor as string,
              positionData: {
                kind: "TEXT",
                pageNumber,
                anchor: selectionInfo.anchor,
              },
            })
            window.getSelection()?.removeAllRanges()
            setSelectionInfo(null)
          }}
          onDismiss={() => setSelectionInfo(null)}
        />
      )}

      {/* Draft Textbox */}
      {draft && draft.pageNumber === pageNumber && (
        <InlineToolbar
          position={srcToScreen(
            (draft.positionData as any).x,
            (draft.positionData as any).y,
            srcW,
            srcH,
            zoom,
            rotation
          )}
          selectedColor={selectedColor as string}
          onColorSelect={(color) => updateAnnotation({ id: (draft as any).id, documentId, color: (color || selectedColor) as string })}
          onComment={() => {}}
          onDismiss={discardDraft}
        />
      )}
    </div>
  )
}
