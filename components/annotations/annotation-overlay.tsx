"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import {
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useListByDocumentQuery,
  useUpdateAnnotationMutation,
} from "@/features/annotations/api"
import { resolveTextAnchor } from "@/features/annotations/reanchor"
import {
  screenToSrc,
  srcToScreen,
  TOOL_TO_TYPE,
} from "@/features/annotations/types"
import type {
  AnnotationWithTags,
  PositionData,
  TextAnchor,
  TextRect,
} from "@/features/annotations/types"
import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"

import { AnnotationHoverCard } from "./annotation-hover-card"
import { ColorPicker } from "./color-picker"
import { InlineToolbar } from "./inline-toolbar"

interface AnnotationOverlayProps {
  documentId: string
  pageNumber: number
  zoom: number
  rotation: 0 | 90 | 180 | 270
  srcW: number
  srcH: number
  screenW: number
  screenH: number
}

interface ResolvedAnnotationMeta {
  positionData: PositionData
  orphaned: boolean
}

const HOVER_DELAY_MS = 150
const DESKTOP_ONLY_TOOLS = new Set(["freehand", "rectangle", "circle", "arrow"])

function useCoarsePointer() {
  const [coarsePointer, setCoarsePointer] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }

    const media = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarsePointer(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return coarsePointer
}

export function AnnotationOverlay({
  documentId,
  pageNumber,
  zoom,
  rotation,
  srcW,
  srcH,
  screenW,
  screenH,
}: AnnotationOverlayProps) {
  const { data: allAnnotations = [] } = useListByDocumentQuery(documentId)
  const [createAnnotation] = useCreateAnnotationMutation()
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const [updateAnnotation] = useUpdateAnnotationMutation()

  const activeTool = useViewer((state) => state.activeTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const toolThickness = useViewer((state) => state.toolThickness)
  const hoveredAnnotationId = useViewer((state) => state.hoveredAnnotationId)
  const selectedAnnotationId = useViewer((state) => state.rightPanelAnnotationId)
  const relocatingAnnotationId = useViewer((state) => state.relocatingAnnotationId)
  const setHoveredAnnotation = useViewer((state) => state.setHoveredAnnotation)
  const openAnnotation = useViewer((state) => state.openAnnotation)
  const cancelRelocatingAnnotation = useViewer(
    (state) => state.cancelRelocatingAnnotation
  )
  const pushUndo = useViewer((state) => state.pushUndo)
  const setAnnotationOrphaned = useViewer((state) => state.setAnnotationOrphaned)

  const coarsePointer = useCoarsePointer()
  const overlayRef = useRef<HTMLDivElement>(null)

  const pageAnnotations = useMemo(
    () => allAnnotations.filter((annotation) => annotation.pageNumber === pageNumber),
    [allAnnotations, pageNumber]
  )

  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedAnnotationMeta>>({})
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [selectionInfo, setSelectionInfo] = useState<{
    anchor: TextAnchor
    pos: { x: number; y: number }
  } | null>(null)
  const [drawRect, setDrawRect] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const [drawPath, setDrawPath] = useState<Array<{ x: number; y: number }>>([])
  const [arrowDraw, setArrowDraw] = useState<{
    from: { x: number; y: number }
    to: { x: number; y: number }
  } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    annotation: AnnotationWithTags
    x: number
    y: number
  } | null>(null)

  const drawingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredIdRef = useRef<string | null>(null)

  const relocateTextAnnotation = useCallback(
    async (anchor: TextAnchor) => {
      const target = pageAnnotations.find(
        (annotation) => annotation.id === relocatingAnnotationId
      )

      if (!target || target.positionData.kind !== "TEXT") {
        return
      }

      const updated = await updateAnnotation({
        id: target.id,
        documentId,
        positionData: {
          kind: "TEXT",
          pageNumber,
          anchor,
        },
      }).unwrap()

      pushUndo({
        action: "update",
        before: target,
        after: updated,
      })

      setAnnotationOrphaned(target.id, false)
      cancelRelocatingAnnotation()
      openAnnotation(target.id)
      toast.success("Annotation relocated")
    },
    [
      cancelRelocatingAnnotation,
      documentId,
      openAnnotation,
      pageAnnotations,
      pageNumber,
      pushUndo,
      relocatingAnnotationId,
      setAnnotationOrphaned,
      updateAnnotation,
    ]
  )

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    function closeMenu() {
      setContextMenu(null)
    }

    window.addEventListener("click", closeMenu)
    window.addEventListener("scroll", closeMenu, true)
    window.addEventListener("resize", closeMenu)

    return () => {
      window.removeEventListener("click", closeMenu)
      window.removeEventListener("scroll", closeMenu, true)
      window.removeEventListener("resize", closeMenu)
    }
  }, [])

  useEffect(() => {
    const isTextTool =
      activeTool === "highlight" ||
      activeTool === "underline" ||
      activeTool === "strikethrough" ||
      activeTool === "squiggly"

    if (!isTextTool) {
      setSelectionInfo(null)
      return
    }

    function onSelectionEnd() {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        return
      }

      const range = selection.getRangeAt(0)
      const rects = Array.from(range.getClientRects())
      if (rects.length === 0 || !overlayRef.current) {
        return
      }

      const overlayRect = overlayRef.current.getBoundingClientRect()
      const sourceRects: TextRect[] = rects.map((rect) => {
        const relX = rect.left - overlayRect.left
        const relY = rect.top - overlayRect.top
        const srcPoint = screenToSrc(relX, relY, srcW, srcH, zoom, rotation)

        return {
          x: srcPoint.x,
          y: srcPoint.y,
          width: rect.width / zoom,
          height: rect.height / zoom,
        }
      })

      const firstRect = rects[0]
      const anchor = {
        rects: sourceRects,
        quotedText: selection.toString().slice(0, 5000),
        prefix: "",
        suffix: "",
      }

      if (relocatingAnnotationId) {
        void relocateTextAnnotation(anchor)
        window.getSelection()?.removeAllRanges()
        setSelectionInfo(null)
        return
      }

      setSelectionInfo({
        anchor,
        pos: {
          x: firstRect.left - overlayRect.left,
          y: firstRect.top - overlayRect.top,
        },
      })
    }

    document.addEventListener("mouseup", onSelectionEnd)
    return () => document.removeEventListener("mouseup", onSelectionEnd)
  }, [
    activeTool,
    relocateTextAnnotation,
    relocatingAnnotationId,
    rotation,
    srcH,
    srcW,
    zoom,
  ])

  useEffect(() => {
    if (!overlayRef.current) {
      return
    }

    const textLayer = overlayRef.current.parentElement?.querySelector<HTMLElement>(
      `[data-text-layer="${pageNumber}"]`
    )

    const nextResolved: Record<string, ResolvedAnnotationMeta> = {}

    pageAnnotations.forEach((annotation) => {
      if (annotation.positionData.kind !== "TEXT" || !textLayer) {
        nextResolved[annotation.id] = {
          positionData: annotation.positionData,
          orphaned: false,
        }
        setAnnotationOrphaned(annotation.id, false)
        return
      }

      const spanNodes = Array.from(
        textLayer.querySelectorAll<HTMLElement>("[data-text-span='true']")
      )

      const overlayRect = overlayRef.current!.getBoundingClientRect()
      const segments = spanNodes.map((span) => {
        const spanRect = span.getBoundingClientRect()
        const relativeX = spanRect.left - overlayRect.left
        const relativeY = spanRect.top - overlayRect.top
        const srcPoint = screenToSrc(relativeX, relativeY, srcW, srcH, zoom, rotation)

        return {
          text: span.dataset.textContent ?? span.textContent ?? "",
          rect: {
            x: srcPoint.x,
            y: srcPoint.y,
            width: spanRect.width / zoom,
            height: spanRect.height / zoom,
          },
        }
      })

      const reanchored = resolveTextAnchor(segments, annotation.positionData.anchor)
      nextResolved[annotation.id] = {
        positionData: {
          ...annotation.positionData,
          anchor: {
            ...annotation.positionData.anchor,
            rects: reanchored.rects,
          },
        },
        orphaned: reanchored.orphaned,
      }
      setAnnotationOrphaned(annotation.id, reanchored.orphaned)
    })

    setResolvedMap(nextResolved)
  }, [
    pageAnnotations,
    pageNumber,
    rotation,
    setAnnotationOrphaned,
    srcH,
    srcW,
    zoom,
  ])

  const hoveredAnnotation = pageAnnotations.find(
    (annotation) => annotation.id === hoveredAnnotationId
  )
  function clearHoverState() {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    hoveredIdRef.current = null
    setHoveredAnnotation(null)
    setHoverPos(null)
  }

  function setHoverForTarget(event: React.MouseEvent | React.FocusEvent, annotationId: string) {
    if (coarsePointer && "clientX" in event === false) {
      return
    }

    const rect = overlayRef.current?.getBoundingClientRect()
    let x = 12
    let y = 12

    if ("clientX" in event) {
      x = event.clientX - (rect?.left ?? 0)
      y = event.clientY - (rect?.top ?? 0)
    } else {
      const targetRect = (event.currentTarget as SVGElement).getBoundingClientRect()
      x = targetRect.left - (rect?.left ?? 0)
      y = targetRect.top - (rect?.top ?? 0)
    }

    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
    }
    hoveredIdRef.current = annotationId
    const apply = () => {
      if (hoveredIdRef.current !== annotationId) return
      setHoveredAnnotation(annotationId)
      setHoverPos({ x, y })
    }

    if (coarsePointer) {
      apply()
      return
    }

    hoverTimerRef.current = setTimeout(apply, HOVER_DELAY_MS)
  }

  async function restoreDeletedAnnotation(annotation: AnnotationWithTags) {
    const recreated = await createAnnotation({
      documentId,
      pageNumber: annotation.pageNumber,
      type: annotation.type,
      color: annotation.color,
      positionData: annotation.positionData,
      ...(annotation.content ? { content: annotation.content } : {}),
    }).unwrap()

    pushUndo({ action: "create", before: null, after: recreated })
  }

  async function createAndTrack(
    input: Parameters<typeof createAnnotation>[0],
    options?: { openPanel?: boolean }
  ) {
    const created = await createAnnotation(input).unwrap()
    pushUndo({ action: "create", before: null, after: created })

    if (options?.openPanel) {
      openAnnotation(created.id)
    }

    return created
  }

  async function commitTextAnnotation(
    color: string,
    options?: { openPanel?: boolean }
  ) {
    if (!selectionInfo) return

    const annotationType = TOOL_TO_TYPE[activeTool]
    if (!annotationType) return

    const anchor = selectionInfo.anchor
    setSelectionInfo(null)
    window.getSelection()?.removeAllRanges()

    if (relocatingAnnotationId) {
      await relocateTextAnnotation(anchor)
      return
    }

    await createAndTrack(
      {
        documentId,
        pageNumber,
        type: annotationType,
        color,
        positionData: {
          kind: "TEXT",
          pageNumber,
          anchor,
        },
      },
      options
    )
  }

  async function handleAnnotationActivate(annotation: AnnotationWithTags) {
    if (activeTool === "eraser") {
      pushUndo({ action: "delete", before: annotation, after: null })
      await deleteAnnotation({ id: annotation.id, documentId }).unwrap()
      toast.success("Annotation deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreDeletedAnnotation(annotation)
          },
        },
      })
      return
    }

    setContextMenu(null)
    openAnnotation(annotation.id)
  }

  async function handleContextDelete(annotation: AnnotationWithTags) {
    pushUndo({ action: "delete", before: annotation, after: null })
    setContextMenu(null)
    await deleteAnnotation({ id: annotation.id, documentId }).unwrap()
    toast.success("Annotation deleted", {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          void restoreDeletedAnnotation(annotation)
        },
      },
    })
  }

  async function handleContextColorChange(annotation: AnnotationWithTags, color: string) {
    if (annotation.color === color) {
      setContextMenu(null)
      return
    }

    const updated = await updateAnnotation({
      id: annotation.id,
      documentId,
      color,
    }).unwrap()

    pushUndo({
      action: "update",
      before: annotation,
      after: updated,
    })
    setContextMenu(null)
  }

  function getRelPos(event: React.MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
  }

  function getSrcPos(screenPoint: { x: number; y: number }) {
    return screenToSrc(screenPoint.x, screenPoint.y, srcW, srcH, zoom, rotation)
  }

  async function handleSvgMouseDown(event: React.MouseEvent<SVGSVGElement>) {
    if ((event.target as Element).closest("[data-annotation]")) return

    const isDesktopOnly = DESKTOP_ONLY_TOOLS.has(activeTool)
    if (coarsePointer && isDesktopOnly) {
      toast.message("This tool is available on desktop.")
      return
    }

    const isNonDrawingTool =
      activeTool === "select" ||
      activeTool === "eraser" ||
      activeTool === "highlight" ||
      activeTool === "underline" ||
      activeTool === "strikethrough" ||
      activeTool === "squiggly"

    if (isNonDrawingTool) return

    drawingRef.current = true
    const rel = getRelPos(event)
    startPosRef.current = rel

    if (activeTool === "freehand") {
      setDrawPath([rel])
      return
    }

    if (activeTool === "arrow") {
      setArrowDraw({ from: rel, to: rel })
      return
    }

    if (activeTool === "rectangle" || activeTool === "circle") {
      setDrawRect({ x: rel.x, y: rel.y, w: 0, h: 0 })
      return
    }

    if (activeTool === "note") {
      const srcPos = getSrcPos(rel)
      await createAndTrack(
        {
          documentId,
          pageNumber,
          type: "NOTE",
          color: selectedColor,
          positionData: {
            kind: "POINT",
            pageNumber,
            x: srcPos.x,
            y: srcPos.y,
          },
          content: "",
        },
        { openPanel: true }
      )
      drawingRef.current = false
      startPosRef.current = null
      return
    }

    if (activeTool === "textbox") {
      const srcPos = getSrcPos(rel)
      await createAndTrack(
        {
          documentId,
          pageNumber,
          type: "TEXTBOX",
          color: selectedColor,
          positionData: {
            kind: "RECT",
            pageNumber,
            x: srcPos.x,
            y: srcPos.y,
            width: 150 / zoom,
            height: 80 / zoom,
          },
          content: "",
        },
        { openPanel: true }
      )
      drawingRef.current = false
      startPosRef.current = null
    }
  }

  function handleSvgMouseMove(event: React.MouseEvent<SVGSVGElement>) {
    if (!drawingRef.current || !startPosRef.current) return
    const rel = getRelPos(event)

    if (activeTool === "freehand") {
      setDrawPath((previous) => [...previous, rel])
      return
    }

    if (activeTool === "arrow") {
      setArrowDraw((previous) => (previous ? { ...previous, to: rel } : null))
      return
    }

    if (activeTool === "rectangle" || activeTool === "circle") {
      const start = startPosRef.current
      setDrawRect({
        x: Math.min(start.x, rel.x),
        y: Math.min(start.y, rel.y),
        w: Math.abs(rel.x - start.x),
        h: Math.abs(rel.y - start.y),
      })
    }
  }

  async function handleSvgMouseUp() {
    if (!drawingRef.current) return

    drawingRef.current = false

    if (activeTool === "freehand" && drawPath.length >= 2) {
      const srcPoints = drawPath.map((point) => getSrcPos(point))
      await createAndTrack({
        documentId,
        pageNumber,
        type: "FREEHAND",
        color: selectedColor,
        positionData: {
          kind: "PATH",
          pageNumber,
          points: srcPoints,
          strokeWidth: toolThickness / zoom,
        },
      })
      setDrawPath([])
    } else if (activeTool === "arrow" && arrowDraw) {
      await createAndTrack({
        documentId,
        pageNumber,
        type: "ARROW",
        color: selectedColor,
        positionData: {
          kind: "ARROW",
          pageNumber,
          from: getSrcPos(arrowDraw.from),
          to: getSrcPos(arrowDraw.to),
          strokeWidth: toolThickness / zoom,
        },
      })
      setArrowDraw(null)
    } else if (
      (activeTool === "rectangle" || activeTool === "circle") &&
      drawRect &&
      drawRect.w > 4 &&
      drawRect.h > 4
    ) {
      const srcTopLeft = getSrcPos({ x: drawRect.x, y: drawRect.y })
      await createAndTrack({
        documentId,
        pageNumber,
        type: activeTool === "rectangle" ? "RECTANGLE" : "CIRCLE",
        color: selectedColor,
        positionData: {
          kind: "RECT",
          pageNumber,
          x: srcTopLeft.x,
          y: srcTopLeft.y,
          width: drawRect.w / zoom,
          height: drawRect.h / zoom,
        },
      })
      setDrawRect(null)
    }

    startPosRef.current = null
  }

  function renderAnnotation(annotation: AnnotationWithTags) {
    const meta = resolvedMap[annotation.id]
    const resolvedPosition = meta?.positionData ?? annotation.positionData
    const orphaned = meta?.orphaned ?? false
    const isHovered = annotation.id === hoveredAnnotationId
    const isSelected = annotation.id === selectedAnnotationId
    const isEraser = activeTool === "eraser"
    const opacity = isHovered ? (isEraser ? 0.4 : 0.8) : 1
    const ringColor = isEraser ? "#ef4444" : annotation.color

    const sharedProps = {
      "data-annotation": annotation.id,
      role: "button",
      tabIndex: 0,
      "aria-label": `${annotation.type.toLowerCase()} annotation${
        orphaned ? ", needs relocation" : ""
      }${annotation.content ? `, ${annotation.content}` : ""}`,
      className: cn(
        "cursor-pointer transition-opacity duration-100",
        isHovered && "opacity-80"
      ),
      onMouseEnter: (event: React.MouseEvent) => {
        if (!coarsePointer) setHoverForTarget(event, annotation.id)
      },
      onMouseLeave: clearHoverState,
      onFocus: (event: React.FocusEvent) => setHoverForTarget(event, annotation.id),
      onBlur: clearHoverState,
      onClick: (event: React.MouseEvent) => {
        event.stopPropagation()
        setContextMenu(null)
        void handleAnnotationActivate(annotation)
      },
      onContextMenu: (event: React.MouseEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setContextMenu({
          annotation,
          x: event.clientX,
          y: event.clientY,
        })
      },
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          void handleAnnotationActivate(annotation)
        }
      },
      style: { pointerEvents: "auto" as const },
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
            const middleY = y + height / 2
            const bottomY = y + height

            return (
              <g key={index}>
                {annotation.type === "HIGHLIGHT" ? (
                  <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={annotation.color}
                    fillOpacity={0.35}
                    rx={2}
                  />
                ) : null}
                {isSelected || isHovered ? (
                  <rect
                    x={x - 2}
                    y={y - 2}
                    width={width + 4}
                    height={height + 4}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={2}
                    rx={4}
                    strokeOpacity={isSelected ? 0.95 : 0.7}
                  />
                ) : null}
                {annotation.type === "UNDERLINE" ? (
                  <line
                    x1={x}
                    y1={bottomY}
                    x2={x + width}
                    y2={bottomY}
                    stroke={annotation.color}
                    strokeWidth={Math.max(1, zoom)}
                    strokeLinecap="round"
                  />
                ) : null}
                {annotation.type === "STRIKETHROUGH" ? (
                  <line
                    x1={x}
                    y1={middleY}
                    x2={x + width}
                    y2={middleY}
                    stroke={annotation.color}
                    strokeWidth={Math.max(1, zoom)}
                    strokeLinecap="round"
                  />
                ) : null}
                {annotation.type === "SQUIGGLY" ? (
                  <SquigglyLine
                    x={x}
                    y={bottomY}
                    width={width}
                    color={annotation.color}
                    amplitude={Math.max(1.5, zoom * 1.5)}
                  />
                ) : null}
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={Math.max(height, 8)}
                  fill="transparent"
                />
                {orphaned && index === 0 ? (
                  <g transform={`translate(${x - 8}, ${y - 8})`} aria-hidden="true">
                    <circle cx="8" cy="8" r="8" fill="#f59e0b" />
                    <foreignObject x="2" y="2" width="12" height="12">
                      <AlertTriangle className="size-3 text-white" />
                    </foreignObject>
                  </g>
                ) : null}
              </g>
            )
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
              r={isSelected ? 13 : 12}
              fill="none"
              stroke={ringColor}
              strokeWidth={2}
              strokeOpacity={isSelected ? 0.95 : 0.7}
            />
          ) : null}
          <text
            x={point.x}
            y={point.y + 4}
            textAnchor="middle"
            fontSize={9}
            fill="white"
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            N
          </text>
        </g>
      )
    }

    if (resolvedPosition.kind === "RECT") {
      const topLeft = srcToScreen(
        resolvedPosition.x,
        resolvedPosition.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const bottomRight = srcToScreen(
        resolvedPosition.x + resolvedPosition.width,
        resolvedPosition.y + resolvedPosition.height,
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
        <g key={annotation.id} {...sharedProps}>
          {annotation.type === "CIRCLE" ? (
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={width / 2}
              ry={height / 2}
              fill={annotation.color}
              fillOpacity={0.12}
              stroke={annotation.color}
              strokeWidth={isHovered ? 2.5 * zoom : 2 * zoom}
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
        </g>
      )
    }

    if (resolvedPosition.kind === "PATH") {
      if (resolvedPosition.points.length < 2) return null
      const pathData = resolvedPosition.points
        .map((point, index) => {
          const screenPoint = srcToScreen(
            point.x,
            point.y,
            srcW,
            srcH,
            zoom,
            rotation
          )
          return `${index === 0 ? "M" : "L"} ${screenPoint.x} ${screenPoint.y}`
        })
        .join(" ")

      return (
        <g key={annotation.id} {...sharedProps}>
          {isSelected || isHovered ? (
            <path
              d={pathData}
              fill="none"
              stroke={ringColor}
              strokeWidth={Math.max(4, resolvedPosition.strokeWidth * zoom + 3)}
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
            opacity={opacity}
          />
        </g>
      )
    }

    if (resolvedPosition.kind === "ARROW") {
      const from = srcToScreen(
        resolvedPosition.from.x,
        resolvedPosition.from.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const to = srcToScreen(
        resolvedPosition.to.x,
        resolvedPosition.to.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const markerId = `arrow-${annotation.id}`

      return (
        <g key={annotation.id} {...sharedProps}>
          <defs>
            <marker
              id={markerId}
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L8,3 z" fill={annotation.color} />
            </marker>
          </defs>
          <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={annotation.color}
            strokeWidth={resolvedPosition.strokeWidth * zoom}
            strokeLinecap="round"
            markerEnd={`url(#${markerId})`}
            opacity={opacity}
          />
          {isSelected || isHovered ? (
            <line
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={ringColor}
              strokeWidth={Math.max(4, resolvedPosition.strokeWidth * zoom + 3)}
              strokeLinecap="round"
              strokeOpacity={isSelected ? 0.35 : 0.2}
            />
          ) : null}
          <line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="transparent"
            strokeWidth={Math.max(12, resolvedPosition.strokeWidth * zoom * 3)}
          />
        </g>
      )
    }

    return null
  }

  function renderDrawPreview() {
    if (activeTool === "freehand" && drawPath.length >= 2) {
      const pathData = drawPath
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
        .join(" ")

      return (
        <path
          d={pathData}
          fill="none"
          stroke={selectedColor}
          strokeWidth={toolThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.7}
          style={{ pointerEvents: "none" }}
        />
      )
    }

    if (activeTool === "arrow" && arrowDraw) {
      return (
        <line
          x1={arrowDraw.from.x}
          y1={arrowDraw.from.y}
          x2={arrowDraw.to.x}
          y2={arrowDraw.to.y}
          stroke={selectedColor}
          strokeWidth={toolThickness}
          strokeLinecap="round"
          opacity={0.7}
          style={{ pointerEvents: "none" }}
        />
      )
    }

    if (drawRect && (activeTool === "rectangle" || activeTool === "circle")) {
      const centerX = drawRect.x + drawRect.w / 2
      const centerY = drawRect.y + drawRect.h / 2

      return activeTool === "circle" ? (
        <ellipse
          cx={centerX}
          cy={centerY}
          rx={drawRect.w / 2}
          ry={drawRect.h / 2}
          fill={selectedColor}
          fillOpacity={0.1}
          stroke={selectedColor}
          strokeWidth={toolThickness}
          opacity={0.7}
          style={{ pointerEvents: "none" }}
        />
      ) : (
        <rect
          x={drawRect.x}
          y={drawRect.y}
          width={drawRect.w}
          height={drawRect.h}
          fill={selectedColor}
          fillOpacity={0.1}
          stroke={selectedColor}
          strokeWidth={toolThickness}
          rx={2}
          opacity={0.7}
          style={{ pointerEvents: "none" }}
        />
      )
    }

    return null
  }

  const isDrawingTool =
    activeTool !== "select" &&
    activeTool !== "highlight" &&
    activeTool !== "underline" &&
    activeTool !== "strikethrough" &&
    activeTool !== "squiggly" &&
    activeTool !== "eraser"

  const cursor =
    activeTool === "eraser"
      ? "cell"
      : activeTool === "note" || activeTool === "textbox" || isDrawingTool
        ? "crosshair"
        : "default"

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      data-annotation-overlay={pageNumber}
    >
      <svg
        width={screenW}
        height={screenH}
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
        style={{
          cursor,
          pointerEvents: isDrawingTool || activeTool === "eraser" ? "auto" : "none",
          overflow: "visible",
        }}
        onMouseDown={isDrawingTool ? (event) => void handleSvgMouseDown(event) : undefined}
        onMouseMove={isDrawingTool ? handleSvgMouseMove : undefined}
        onMouseUp={isDrawingTool ? () => void handleSvgMouseUp() : undefined}
        onContextMenu={(event) => {
          if (!(event.target as Element).closest("[data-annotation]")) {
            event.preventDefault()
            setContextMenu(null)
          }
        }}
      >
        <g style={{ pointerEvents: "none" }}>
          {pageAnnotations.map((annotation) => (
            <g key={annotation.id} style={{ pointerEvents: "auto" }}>
              {renderAnnotation(annotation)}
            </g>
          ))}
        </g>
        {renderDrawPreview()}
      </svg>

      {hoveredAnnotation && hoverPos ? (
        <AnnotationHoverCard
          annotation={hoveredAnnotation}
          position={hoverPos}
          orphaned={resolvedMap[hoveredAnnotation.id]?.orphaned ?? false}
        />
      ) : null}

      {selectionInfo ? (
        <InlineToolbar
          position={selectionInfo.pos}
          selectedColor={selectedColor}
          onColorSelect={(color) => {
            void commitTextAnnotation(color)
          }}
          onComment={() => {
            void commitTextAnnotation(selectedColor, { openPanel: true })
          }}
          onDismiss={() => {
            setSelectionInfo(null)
            window.getSelection()?.removeAllRanges()
          }}
        />
      ) : null}

      {contextMenu ? (
        <div
          className="pointer-events-auto fixed z-50 min-w-52 rounded-xl border border-border/70 bg-popover/95 p-2 text-sm shadow-2xl backdrop-blur-xl"
          style={{ left: contextMenu.x + 8, top: contextMenu.y + 8 }}
          role="menu"
          aria-label="Annotation actions"
          onClick={(event) => event.stopPropagation()}
        >
          {contextMenu.annotation.positionData.kind === "TEXT" ? (
            <button
              type="button"
              role="menuitem"
              className="flex w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={async () => {
                const text = contextMenu.annotation.positionData.kind === "TEXT"
                  ? contextMenu.annotation.positionData.anchor.quotedText
                  : contextMenu.annotation.content ?? ""
                await navigator.clipboard.writeText(text)
                setContextMenu(null)
                toast.success("Copied text")
              }}
            >
              Copy text
            </button>
          ) : null}
          <div className="rounded-lg px-2.5 py-2">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Change color
            </p>
            <ColorPicker
              size="sm"
              value={contextMenu.annotation.color}
              onChange={(color) => {
                void handleContextColorChange(contextMenu.annotation, color)
              }}
            />
          </div>
          <button
            type="button"
            role="menuitem"
            className="flex w-full rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => void handleContextDelete(contextMenu.annotation)}
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  )
}

function SquigglyLine({
  x,
  y,
  width,
  color,
  amplitude,
}: {
  x: number
  y: number
  width: number
  color: string
  amplitude: number
}) {
  const period = amplitude * 4
  const pathData: string[] = [`M ${x} ${y}`]

  for (let offset = 0; offset < width; offset += period) {
    pathData.push(`q ${period / 2} ${-amplitude} ${period} 0`)
  }

  return (
    <path
      d={pathData.join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
    />
  )
}
