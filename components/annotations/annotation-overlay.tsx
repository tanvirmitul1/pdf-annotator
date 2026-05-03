"use client"

import { AlertTriangle, Trash2 } from "lucide-react"
import { srcToScreen } from "@/features/annotations/types"
import { cn } from "@/lib/utils"


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
    hoveredAnnotation,
    selectionInfo,
    drawRect,
    drawPath,
    arrowDraw,
    activeTool,
    selectedColor,
    selectedAnnotationId,
    draft,
    coarsePointer,
    setSelectionInfo,
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
    addAnnotation,
    isDrawingMode,
    isDrawing,
    isManipulating,
    livePositions,
    toolThickness,
    editingAnnotationId,
    setEditingAnnotation,
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
              ringColor={ringColor}
              opacity={"opacity" in effectivePosition ? (effectivePosition.opacity ?? 1) : 1}
              zoom={zoom}
              rotation={rotation}
              srcW={srcW}
              srcH={srcH}
              activeTool={activeTool}
              selectedAnnotationId={selectedAnnotationId}
              handleRadius={HANDLE_RADIUS}
              textboxPadding={TEXTBOX_PADDING}
              onMouseEnter={() => { }}
              onMouseLeave={() => { }}
              onFocus={() => { }}
              onBlur={() => { }}
              onClick={(e) => {
                if (activeTool === "select" || activeTool === "hand") {
                  e.stopPropagation()
                  handleAnnotationActivate(annotation)
                }
              }}
              onDoubleClick={(e) => {
                if (activeTool === "select" && annotation.type === "TEXTBOX") {
                  e.stopPropagation()
                  setEditingAnnotation(annotation.id)
                }
              }}
              onPointerDown={(e) => {
                if (editingAnnotationId === annotation.id) return
                if (activeTool === "select" || activeTool === "hand") {
                  e.stopPropagation()
                  e.currentTarget.setPointerCapture(e.pointerId)
                  beginManipulation(annotation, "move", e.clientX, e.clientY)
                }
              }}
              onBeginManipulation={beginManipulation}
              editingAnnotationId={editingAnnotationId}
              onStartEditing={(id) => setEditingAnnotation(id)}
              onStopEditing={() => setEditingAnnotation(null)}
              onContentUpdate={(id, content) => {
                updateAnnotation({ id, documentId, content })
              }}
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
        {drawRect && (() => {
          const sx = srcToScreen(drawRect.x, 0, srcW, srcH, zoom, rotation).x
          const sy = srcToScreen(0, drawRect.y, srcW, srcH, zoom, rotation).y
          const sw = drawRect.w * zoom
          const sh = drawRect.h * zoom
          const isRedact = activeTool === "redact"
          const isCircle = activeTool === "circle"

          if (isCircle) {
            return (
              <ellipse
                cx={sx + sw / 2}
                cy={sy + sh / 2}
                rx={sw / 2}
                ry={sh / 2}
                fill="none"
                stroke={selectedColor as string}
                strokeWidth={Math.max(2, toolThickness * zoom)}
                strokeLinecap="round"
                opacity={0.85}
              />
            )
          }

          return (
            <rect
              x={sx}
              y={sy}
              width={sw}
              height={sh}
              fill={isRedact ? "rgba(0,0,0,0.6)" : "transparent"}
              stroke={isRedact ? "black" : (selectedColor as string)}
              strokeWidth={isRedact ? 1 : Math.max(2, toolThickness * zoom)}
              strokeLinecap="round"
              opacity={0.85}
            />
          )
        })()}

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

        {arrowDraw && (() => {
          const from = srcToScreen(arrowDraw.from.x, arrowDraw.from.y, srcW, srcH, zoom, rotation)
          const to = srcToScreen(arrowDraw.to.x, arrowDraw.to.y, srcW, srcH, zoom, rotation)
          const markerId = "arrow-preview-marker"
          return (
            <g>
              <defs>
                <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill={selectedColor as string} />
                </marker>
              </defs>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={selectedColor as string}
                strokeWidth={Math.max(2, toolThickness * zoom)}
                strokeLinecap="round"
                markerEnd={`url(#${markerId})`}
                opacity={0.85}
              />
            </g>
          )
        })()}
      </svg>

      {/* Delete button for selected annotation */}
      {selectedAnnotationId && (() => {
        const selectedAnnotation = pageAnnotations.find(a => a.id === selectedAnnotationId)
        if (!selectedAnnotation) return null
        const effectivePos = livePositions[selectedAnnotationId] ?? resolvedMap[selectedAnnotationId]?.positionData
        if (!effectivePos) return null

        let btnX = 0, btnY = 0
        if (effectivePos.kind === "RECT" || effectivePos.kind === "TEXT_BOX" || effectivePos.kind === "CLOUD") {
          const pos = effectivePos as { x: number; y: number; width: number; height: number }
          const screen = srcToScreen(pos.x + pos.width / 2, pos.y + pos.height, srcW, srcH, zoom, rotation)
          btnX = screen.x
          btnY = screen.y + 12
        } else if (effectivePos.kind === "TEXT") {
          const rects = effectivePos.anchor?.rects ?? []
          if (rects.length > 0) {
            const last = rects[rects.length - 1]
            const screen = srcToScreen(last.x + last.width / 2, last.y + last.height, srcW, srcH, zoom, rotation)
            btnX = screen.x
            btnY = screen.y + 12
          }
        } else if (effectivePos.kind === "PATH") {
          const points = (effectivePos as { points: Array<{ x: number; y: number }> }).points
          if (points.length > 0) {
            const maxY = Math.max(...points.map(p => p.y))
            const avgX = points.reduce((s, p) => s + p.x, 0) / points.length
            const screen = srcToScreen(avgX, maxY, srcW, srcH, zoom, rotation)
            btnX = screen.x
            btnY = screen.y + 12
          }
        } else if (effectivePos.kind === "ARROW") {
          const midX = (effectivePos.from.x + effectivePos.to.x) / 2
          const maxY = Math.max(effectivePos.from.y, effectivePos.to.y)
          const screen = srcToScreen(midX, maxY, srcW, srcH, zoom, rotation)
          btnX = screen.x
          btnY = screen.y + 12
        } else if (effectivePos.kind === "POINT") {
          const screen = srcToScreen(effectivePos.x, effectivePos.y, srcW, srcH, zoom, rotation)
          btnX = screen.x
          btnY = screen.y + 20
        }

        return (
          <button
            className="pointer-events-auto absolute flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-xl ring-1 ring-black/5 transition-all hover:bg-accent hover:text-accent-foreground active:scale-95"
            style={{
              left: btnX,
              top: btnY,
              transform: "translateX(-50%)",
              zIndex: 50,
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              deleteAnnotationImmediate(selectedAnnotationId)
            }}
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </button>
        )
      })()}

      {/* Floating Menus */}

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
          onDismiss={() => setSelectionInfo(null)}
        />
      )}

      {/* Draft Textbox */}
      {draft && draft.pageNumber === pageNumber && (
        <InlineToolbar
          position={srcToScreen(
            (draft.positionData as { x: number }).x ?? 0,
            (draft.positionData as { y: number }).y ?? 0,
            srcW,
            srcH,
            zoom,
            rotation
          )}
          selectedColor={selectedColor as string}
          onColorSelect={(color) => updateAnnotation({ id: draft.id!, documentId, color: (color || selectedColor) as string })}
          onDismiss={discardDraft}
        />
      )}
    </div>
  )
}
