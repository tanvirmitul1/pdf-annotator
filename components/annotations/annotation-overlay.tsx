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
import {
  isMovablePosition,
  isResizablePosition,
  positionDataEquals,
  resizePositionData,
  translatePositionData,
  type ResizeHandle,
} from "@/features/annotations/geometry"
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
import { useAppSelector } from "@/store/hooks"

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
  textLayerGenerationKey: string
  textLayerReadyKey: string | null
}

interface ResolvedAnnotationMeta {
  positionData: PositionData
  orphaned: boolean
}

interface ManipulationState {
  annotation: AnnotationWithTags
  mode: "move" | "resize"
  handle?: ResizeHandle
  startSrc: { x: number; y: number }
  startClient: { x: number; y: number }
  originalPosition: PositionData
}

const HOVER_DELAY_MS = 150
const DESKTOP_ONLY_TOOLS = new Set([
  "freehandHighlight",
  "freehand",
  "rectangle",
  "circle",
  "arrow",
])
const HANDLE_RADIUS = 6
const DRAG_THRESHOLD_PX = 4
const TEXTBOX_PADDING = 8

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
  textLayerGenerationKey,
  textLayerReadyKey,
}: AnnotationOverlayProps) {
  const { data: allAnnotations = [] } = useListByDocumentQuery(documentId)
  const [createAnnotation] = useCreateAnnotationMutation()
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const [updateAnnotation] = useUpdateAnnotationMutation()

  const activeTool = useViewer((state) => state.activeTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const toolThickness = useViewer((state) => state.toolThickness)
  const hoveredAnnotationId = useViewer((state) => state.hoveredAnnotationId)
  const selectedAnnotationId = useViewer(
    (state) => state.rightPanelAnnotationId
  )
  const relocatingAnnotationId = useViewer(
    (state) => state.relocatingAnnotationId
  )
  const setHoveredAnnotation = useViewer((state) => state.setHoveredAnnotation)
  const openAnnotation = useViewer((state) => state.openAnnotation)
  const cancelRelocatingAnnotation = useViewer(
    (state) => state.cancelRelocatingAnnotation
  )
  const pushUndo = useViewer((state) => state.pushUndo)
  const setAnnotationOrphaned = useViewer(
    (state) => state.setAnnotationOrphaned
  )
  const currentUser = useAppSelector((state) => state.auth.user)

  const coarsePointer = useCoarsePointer()
  const overlayRef = useRef<HTMLDivElement>(null)

  const pageAnnotations = useMemo(
    () =>
      allAnnotations.filter(
        (annotation) => annotation.pageNumber === pageNumber
      ),
    [allAnnotations, pageNumber]
  )

  const [resolvedMap, setResolvedMap] = useState<
    Record<string, ResolvedAnnotationMeta>
  >({})
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(
    null
  )
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
  const [, setLivePositions] = useState<Record<string, PositionData>>({})

  const drawingRef = useRef(false)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoveredIdRef = useRef<string | null>(null)
  const manipulationRef = useRef<ManipulationState | null>(null)
  const livePositionsRef = useRef<Record<string, PositionData>>({})
  const movedDuringManipulationRef = useRef(false)
  const erasingRef = useRef(false)
  const erasedAnnotationIdsRef = useRef<Set<string>>(new Set())
  const lastEraserPointRef = useRef<{ x: number; y: number } | null>(null)

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

    const textLayerReady = textLayerReadyKey === textLayerGenerationKey
    const textLayer =
      overlayRef.current.parentElement?.querySelector<HTMLElement>(
        `[data-text-layer="${pageNumber}"]`
      )

    setResolvedMap((previous) => {
      const nextResolved: Record<string, ResolvedAnnotationMeta> = {}

      pageAnnotations.forEach((annotation) => {
        if (annotation.positionData.kind !== "TEXT") {
          nextResolved[annotation.id] = {
            positionData: annotation.positionData,
            orphaned: false,
          }
          setAnnotationOrphaned(annotation.id, false)
          return
        }

        const fallback =
          previous[annotation.id] ?? {
            positionData: annotation.positionData,
            orphaned: false,
          }

        if (!textLayerReady || !textLayer) {
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
          return
        }

        const spanNodes = Array.from(
          textLayer.querySelectorAll<HTMLElement>("[data-text-span='true']")
        )

        if (spanNodes.length === 0) {
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
          return
        }

        try {
          const overlayRect = overlayRef.current!.getBoundingClientRect()
          const segments = spanNodes.map((span) => {
            const spanRect = span.getBoundingClientRect()
            const relativeX = spanRect.left - overlayRect.left
            const relativeY = spanRect.top - overlayRect.top
            const srcPoint = screenToSrc(
              relativeX,
              relativeY,
              srcW,
              srcH,
              zoom,
              rotation
            )

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

          const reanchored = resolveTextAnchor(
            segments,
            annotation.positionData.anchor
          )
          nextResolved[annotation.id] = {
            positionData: {
              kind: "TEXT" as const,
              pageNumber: annotation.positionData.pageNumber,
              anchor: {
                ...annotation.positionData.anchor,
                rects: reanchored.rects,
              },
            },
            orphaned: reanchored.orphaned,
          }
          setAnnotationOrphaned(annotation.id, reanchored.orphaned)
        } catch (error) {
          console.warn(
            `[AnnotationOverlay] Failed to re-anchor annotation ${annotation.id}:`,
            error
          )
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
        }
      })

      return nextResolved
    })
  }, [
    pageAnnotations,
    pageNumber,
    rotation,
    setAnnotationOrphaned,
    srcH,
    srcW,
    textLayerGenerationKey,
    textLayerReadyKey,
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

  const setLivePosition = useCallback(
    (annotationId: string, positionData: PositionData) => {
      setLivePositions((previous) => {
        const next = { ...previous, [annotationId]: positionData }
        livePositionsRef.current = next
        return next
      })
    },
    []
  )

  const clearLivePosition = useCallback((annotationId: string) => {
    setLivePositions((previous) => {
      if (!(annotationId in previous)) {
        return previous
      }

      const next = { ...previous }
      delete next[annotationId]
      livePositionsRef.current = next
      return next
    })
  }, [])

  function getEffectivePositionData(annotation: AnnotationWithTags) {
    return (
      livePositionsRef.current[annotation.id] ??
      resolvedMap[annotation.id]?.positionData ??
      annotation.positionData
    )
  }

  const getRelativeClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const rect = overlayRef.current?.getBoundingClientRect()

      return {
        x: clientX - (rect?.left ?? 0),
        y: clientY - (rect?.top ?? 0),
      }
    },
    []
  )

  const getSourcePointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const relative = getRelativeClientPoint(clientX, clientY)
      return screenToSrc(relative.x, relative.y, srcW, srcH, zoom, rotation)
    },
    [getRelativeClientPoint, rotation, srcH, srcW, zoom]
  )

  function canEditAnnotation(annotation: AnnotationWithTags) {
    if (!currentUser) {
      return false
    }

    return (
      annotation.author?.id === currentUser.id ||
      annotation.userId === currentUser.id ||
      annotation.userId === "optimistic"
    )
  }

  function getScreenBounds(positionData: PositionData) {
    if (positionData.kind === "TEXT") {
      const points = positionData.anchor.rects.flatMap((rect) => {
        const topLeft = srcToScreen(rect.x, rect.y, srcW, srcH, zoom, rotation)
        const bottomRight = srcToScreen(
          rect.x + rect.width,
          rect.y + rect.height,
          srcW,
          srcH,
          zoom,
          rotation
        )

        return [topLeft, bottomRight]
      })

      if (points.length === 0) {
        return null
      }

      const xs = points.map((point) => point.x)
      const ys = points.map((point) => point.y)
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      }
    }

    if (positionData.kind === "POINT") {
      const point = srcToScreen(
        positionData.x,
        positionData.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      return {
        x: point.x - 12,
        y: point.y - 12,
        width: 24,
        height: 24,
      }
    }

    if (positionData.kind === "RECT") {
      const topLeft = srcToScreen(
        positionData.x,
        positionData.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const bottomRight = srcToScreen(
        positionData.x + positionData.width,
        positionData.y + positionData.height,
        srcW,
        srcH,
        zoom,
        rotation
      )

      return {
        x: Math.min(topLeft.x, bottomRight.x),
        y: Math.min(topLeft.y, bottomRight.y),
        width: Math.abs(bottomRight.x - topLeft.x),
        height: Math.abs(bottomRight.y - topLeft.y),
      }
    }

    if (positionData.kind === "PATH") {
      const screenPoints = positionData.points.map((point) =>
        srcToScreen(point.x, point.y, srcW, srcH, zoom, rotation)
      )
      const xs = screenPoints.map((point) => point.x)
      const ys = screenPoints.map((point) => point.y)
      const padding = Math.max(8, positionData.strokeWidth * zoom)

      return {
        x: Math.min(...xs) - padding,
        y: Math.min(...ys) - padding,
        width: Math.max(...xs) - Math.min(...xs) + padding * 2,
        height: Math.max(...ys) - Math.min(...ys) + padding * 2,
      }
    }

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
    const padding = Math.max(10, positionData.strokeWidth * zoom * 1.5)

    return {
      x: Math.min(from.x, to.x) - padding,
      y: Math.min(from.y, to.y) - padding,
      width: Math.abs(to.x - from.x) + padding * 2,
      height: Math.abs(to.y - from.y) + padding * 2,
    }
  }

  function segmentTouchesBounds(
    from: { x: number; y: number },
    to: { x: number; y: number },
    bounds: { x: number; y: number; width: number; height: number },
    padding: number
  ) {
    const expanded = {
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
    }

    const length = Math.hypot(to.x - from.x, to.y - from.y)
    const samples = Math.max(1, Math.ceil(length / Math.max(padding / 2, 4)))

    for (let index = 0; index <= samples; index += 1) {
      const ratio = index / samples
      const x = from.x + (to.x - from.x) * ratio
      const y = from.y + (to.y - from.y) * ratio

      if (
        x >= expanded.x &&
        x <= expanded.x + expanded.width &&
        y >= expanded.y &&
        y <= expanded.y + expanded.height
      ) {
        return true
      }
    }

    return false
  }

  const restoreDeletedAnnotation = useCallback(
    async (annotation: AnnotationWithTags) => {
      const recreated = await createAnnotation({
        documentId,
        pageNumber: annotation.pageNumber,
        type: annotation.type,
        color: annotation.color,
        positionData: annotation.positionData,
        ...(annotation.content ? { content: annotation.content } : {}),
      }).unwrap()

      pushUndo({ action: "create", before: null, after: recreated })
    },
    [createAnnotation, documentId, pushUndo]
  )

  const deleteAnnotationImmediate = useCallback(
    (annotation: AnnotationWithTags, options?: { showToast?: boolean }) => {
      if (erasedAnnotationIdsRef.current.has(annotation.id)) {
        return
      }

      erasedAnnotationIdsRef.current.add(annotation.id)
      pushUndo({ action: "delete", before: annotation, after: null })

      void deleteAnnotation({ id: annotation.id, documentId })
        .unwrap()
        .then(() => {
          if (options?.showToast !== false) {
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
        })
        .catch(() => {
          erasedAnnotationIdsRef.current.delete(annotation.id)
          toast.error("Could not delete annotation")
        })
    },
    [deleteAnnotation, documentId, pushUndo, restoreDeletedAnnotation]
  )

  function eraseAtPoint(
    point: { x: number; y: number },
    previousPoint?: { x: number; y: number } | null
  ) {
    const segmentStart = previousPoint ?? point
    const eraserRadius = Math.max(8, toolThickness)

    pageAnnotations.forEach((annotation) => {
      if (!canEditAnnotation(annotation)) {
        return
      }

      const bounds = getScreenBounds(getEffectivePositionData(annotation))

      if (!bounds) {
        return
      }

      if (segmentTouchesBounds(segmentStart, point, bounds, eraserRadius)) {
        deleteAnnotationImmediate(annotation, { showToast: false })
      }
    })
  }

  function beginManipulation(
    annotation: AnnotationWithTags,
    mode: "move" | "resize",
    clientX: number,
    clientY: number,
    handle?: ResizeHandle
  ) {
    const originalPosition = getEffectivePositionData(annotation)

    if (mode === "move" && !isMovablePosition(originalPosition)) {
      return
    }

    if (
      mode === "resize" &&
      (!handle || !isResizablePosition(originalPosition))
    ) {
      return
    }

    manipulationRef.current = {
      annotation,
      mode,
      handle,
      startSrc: getSourcePointFromClient(clientX, clientY),
      startClient: { x: clientX, y: clientY },
      originalPosition,
    }
    movedDuringManipulationRef.current = false
    openAnnotation(annotation.id)
    setContextMenu(null)
    clearHoverState()
  }

  useEffect(() => {
    async function commitManipulation(state: ManipulationState) {
      const latestPosition = livePositionsRef.current[state.annotation.id]
      clearLivePosition(state.annotation.id)
      manipulationRef.current = null

      if (
        !latestPosition ||
        positionDataEquals(latestPosition, state.originalPosition)
      ) {
        return
      }

      try {
        const updated = await updateAnnotation({
          id: state.annotation.id,
          documentId,
          positionData: latestPosition,
        }).unwrap()

        pushUndo({
          action: "update",
          before: state.annotation,
          after: updated,
        })
      } catch {
        toast.error("Could not update annotation")
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const state = manipulationRef.current
      if (!state) {
        return
      }

      const currentSrc = getSourcePointFromClient(event.clientX, event.clientY)
      const nextPosition =
        state.mode === "move"
          ? translatePositionData(
              state.originalPosition,
              {
                x: currentSrc.x - state.startSrc.x,
                y: currentSrc.y - state.startSrc.y,
              },
              srcW,
              srcH
            )
          : resizePositionData(
              state.originalPosition,
              state.handle!,
              currentSrc,
              zoom,
              srcW,
              srcH
            )

      const movedDistance = Math.hypot(
        event.clientX - state.startClient.x,
        event.clientY - state.startClient.y
      )
      if (movedDistance >= DRAG_THRESHOLD_PX) {
        movedDuringManipulationRef.current = true
      }

      setLivePosition(state.annotation.id, nextPosition)
    }

    function handlePointerEnd() {
      const state = manipulationRef.current
      if (!state) {
        return
      }

      void commitManipulation(state)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerEnd)
    window.addEventListener("pointercancel", handlePointerEnd)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerEnd)
      window.removeEventListener("pointercancel", handlePointerEnd)
    }
  }, [
    clearLivePosition,
    documentId,
    getSourcePointFromClient,
    pushUndo,
    setLivePosition,
    srcH,
    srcW,
    updateAnnotation,
    zoom,
  ])

  function setHoverForTarget(
    event: React.MouseEvent | React.FocusEvent,
    annotationId: string
  ) {
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
      const targetRect = (
        event.currentTarget as SVGElement
      ).getBoundingClientRect()
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

  async function createAndTrack(
    input: Parameters<typeof createAnnotation>[0],
    options?: { openPanel?: boolean }
  ) {
    try {
      const created = await createAnnotation(input).unwrap()
      pushUndo({ action: "create", before: null, after: created })

      if (options?.openPanel) {
        openAnnotation(created.id)
      }

      return created
    } catch {
      toast.error("Could not create annotation")
      return null
    }
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
      if (!canEditAnnotation(annotation)) {
        toast.message("You can only erase annotations that you created.")
        return
      }
      deleteAnnotationImmediate(annotation)
      return
    }

    setContextMenu(null)
    openAnnotation(annotation.id)
  }

  async function handleContextDelete(annotation: AnnotationWithTags) {
    setContextMenu(null)
    if (!canEditAnnotation(annotation)) {
      toast.message("You can only delete annotations that you created.")
      return
    }
    deleteAnnotationImmediate(annotation)
  }

  async function handleContextColorChange(
    annotation: AnnotationWithTags,
    color: string
  ) {
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

    if (activeTool === "freehand" || activeTool === "freehandHighlight") {
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

    if (activeTool === "freehand" || activeTool === "freehandHighlight") {
      setDrawPath((previous) => [...previous, rel])
      return
    }

    if (activeTool === "arrow") {
      const start = startPosRef.current
      const dx = rel.x - start.x
      const dy = rel.y - start.y
      const constrainedTo = event.shiftKey
        ? Math.abs(dx) >= Math.abs(dy)
          ? { x: rel.x, y: start.y }
          : { x: start.x, y: rel.y }
        : rel
      setArrowDraw((previous) =>
        previous ? { ...previous, to: constrainedTo } : null
      )
      return
    }

    if (activeTool === "rectangle" || activeTool === "circle") {
      const start = startPosRef.current
      const deltaX = rel.x - start.x
      const deltaY = rel.y - start.y
      const side = Math.max(Math.abs(deltaX), Math.abs(deltaY))
      const width = event.shiftKey ? side : Math.abs(deltaX)
      const height = event.shiftKey ? side : Math.abs(deltaY)
      const targetX = event.shiftKey
        ? start.x + Math.sign(deltaX || 1) * side
        : rel.x
      const targetY = event.shiftKey
        ? start.y + Math.sign(deltaY || 1) * side
        : rel.y
      setDrawRect({
        x: Math.min(start.x, targetX),
        y: Math.min(start.y, targetY),
        w: width,
        h: height,
      })
    }
  }

  async function handleSvgMouseUp() {
    if (!drawingRef.current) return

    drawingRef.current = false

    if (
      (activeTool === "freehand" || activeTool === "freehandHighlight") &&
      drawPath.length >= 2
    ) {
      const srcPoints = drawPath.map((point) => getSrcPos(point))
      const pathStyle =
        activeTool === "freehandHighlight" ? "highlighter" : "pen"
      const nextPath = {
        documentId,
        pageNumber,
        type: "FREEHAND" as const,
        color: selectedColor,
        positionData: {
          kind: "PATH" as const,
          pageNumber,
          points: srcPoints,
          strokeWidth: toolThickness / zoom,
          style: pathStyle as "pen" | "highlighter",
        },
      }
      setDrawPath([])
      void createAndTrack(nextPath)
    } else if (activeTool === "arrow" && arrowDraw) {
      const nextArrow = {
        documentId,
        pageNumber,
        type: "ARROW" as const,
        color: selectedColor,
        positionData: {
          kind: "ARROW" as const,
          pageNumber,
          from: getSrcPos(arrowDraw.from),
          to: getSrcPos(arrowDraw.to),
          strokeWidth: toolThickness / zoom,
        },
      }
      setDrawPath([])
      setArrowDraw(null)
      void createAndTrack(nextArrow)
    } else if (
      (activeTool === "rectangle" || activeTool === "circle") &&
      drawRect &&
      drawRect.w > 4 &&
      drawRect.h > 4
    ) {
      const srcTopLeft = getSrcPos({ x: drawRect.x, y: drawRect.y })
      const nextShape = {
        documentId,
        pageNumber,
        type: (activeTool === "rectangle" ? "RECTANGLE" : "CIRCLE") as
          | "RECTANGLE"
          | "CIRCLE",
        color: selectedColor,
        positionData: {
          kind: "RECT" as const,
          pageNumber,
          x: srcTopLeft.x,
          y: srcTopLeft.y,
          width: drawRect.w / zoom,
          height: drawRect.h / zoom,
        },
      }
      setDrawRect(null)
      void createAndTrack(nextShape)
    }

    setDrawPath([])
    setArrowDraw(null)
    setDrawRect(null)
    startPosRef.current = null
  }

  function handleEraserPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (activeTool !== "eraser") {
      return
    }

    const point = getRelativeClientPoint(event.clientX, event.clientY)
    erasingRef.current = true
    erasedAnnotationIdsRef.current.clear()
    lastEraserPointRef.current = point
    clearHoverState()
    eraseAtPoint(point)
  }

  function handleEraserPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (activeTool !== "eraser" || !erasingRef.current) {
      return
    }

    const point = getRelativeClientPoint(event.clientX, event.clientY)
    eraseAtPoint(point, lastEraserPointRef.current)
    lastEraserPointRef.current = point
  }

  function handleEraserPointerEnd() {
    if (!erasingRef.current) {
      return
    }

    erasingRef.current = false
    erasedAnnotationIdsRef.current.clear()
    lastEraserPointRef.current = null
  }

  function renderResizeHandles(
    annotation: AnnotationWithTags,
    positionData: PositionData
  ) {
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
        r={HANDLE_RADIUS}
        data-annotation-handle="true"
        fill="hsl(var(--background))"
        stroke={annotation.color}
        strokeWidth={2}
        style={{ cursor: cursorStyle, pointerEvents: "auto" }}
        onPointerDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
          beginManipulation(
            annotation,
            "resize",
            event.clientX,
            event.clientY,
            handle
          )
        }}
      />
    )

    if (positionData.kind === "RECT") {
      const topLeft = srcToScreen(
        positionData.x,
        positionData.y,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const bottomRight = srcToScreen(
        positionData.x + positionData.width,
        positionData.y + positionData.height,
        srcW,
        srcH,
        zoom,
        rotation
      )
      const x1 = Math.min(topLeft.x, bottomRight.x)
      const y1 = Math.min(topLeft.y, bottomRight.y)
      const x2 = Math.max(topLeft.x, bottomRight.x)
      const y2 = Math.max(topLeft.y, bottomRight.y)

      return [
        handleProps("nw", x1, y1, "nwse-resize"),
        handleProps("ne", x2, y1, "nesw-resize"),
        handleProps("sw", x1, y2, "nesw-resize"),
        handleProps("se", x2, y2, "nwse-resize"),
      ]
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

      return [
        handleProps("start", from.x, from.y, "grab"),
        handleProps("end", to.x, to.y, "grab"),
      ]
    }

    return null
  }

  function renderAnnotation(annotation: AnnotationWithTags) {
    const meta = resolvedMap[annotation.id]
    const resolvedPosition = getEffectivePositionData(annotation)
    const orphaned = meta?.orphaned ?? false
    const isHovered = annotation.id === hoveredAnnotationId
    const isSelected = annotation.id === selectedAnnotationId
    const isEraser = activeTool === "eraser"
    const canEdit = canEditAnnotation(annotation)
    const opacity = isHovered ? (isEraser ? 0.4 : 0.8) : 1
    const ringColor = isEraser ? "#ef4444" : annotation.color
    const canMove =
      activeTool === "select" && canEdit && isMovablePosition(resolvedPosition)
    const isManipulating =
      manipulationRef.current?.annotation.id === annotation.id
    const cursorStyle =
      activeTool === "eraser"
        ? "cell"
        : canMove
          ? isManipulating
            ? "grabbing"
            : "grab"
          : "pointer"

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
      onFocus: (event: React.FocusEvent) =>
        setHoverForTarget(event, annotation.id),
      onBlur: clearHoverState,
      onClick: (event: React.MouseEvent) => {
        event.stopPropagation()
        if (movedDuringManipulationRef.current) {
          movedDuringManipulationRef.current = false
          return
        }
        setContextMenu(null)
        void handleAnnotationActivate(annotation)
      },
      onPointerDown: (event: React.PointerEvent) => {
        if (activeTool !== "select" || !canMove) {
          return
        }

        if (
          (event.target as Element).closest("[data-annotation-handle='true']")
        ) {
          return
        }

        event.preventDefault()
        event.stopPropagation()
        beginManipulation(annotation, "move", event.clientX, event.clientY)
      },
      onContextMenu: (event: React.MouseEvent) => {
        if (!canEdit) {
          return
        }
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
      style: { pointerEvents: "auto" as const, cursor: cursorStyle },
    }

    if (resolvedPosition.kind === "TEXT") {
      return (
        <g key={annotation.id} {...sharedProps}>
          {resolvedPosition.anchor.rects.map((rect, index) => {
            const topLeft = srcToScreen(
              rect.x,
              rect.y,
              srcW,
              srcH,
              zoom,
              rotation
            )
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
                  <g
                    transform={`translate(${x - 8}, ${y - 8})`}
                    aria-hidden="true"
                  >
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
          {renderResizeHandles(annotation, resolvedPosition)}
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
          {annotation.type === "TEXTBOX" ? (
            <foreignObject
              x={x + TEXTBOX_PADDING}
              y={y + TEXTBOX_PADDING}
              width={Math.max(width - TEXTBOX_PADDING * 2, 1)}
              height={Math.max(height - TEXTBOX_PADDING * 2, 1)}
              style={{ pointerEvents: "none" }}
            >
              <div
                className="h-full w-full overflow-hidden text-[13px] leading-5 break-words whitespace-pre-wrap text-foreground"
                style={{ color: annotation.color }}
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

      const isHighlighterStroke = resolvedPosition.style === "highlighter"

      return (
        <g key={annotation.id} {...sharedProps}>
          {isSelected || isHovered ? (
            <path
              d={pathData}
              fill="none"
              stroke={ringColor}
              strokeWidth={Math.max(
                isHighlighterStroke ? 10 : 4,
                resolvedPosition.strokeWidth * zoom +
                  (isHighlighterStroke ? 5 : 3)
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
            style={
              isHighlighterStroke
                ? { mixBlendMode: "multiply" as const }
                : undefined
            }
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
          {renderResizeHandles(annotation, resolvedPosition)}
        </g>
      )
    }

    return null
  }

  function renderDrawPreview() {
    if (
      (activeTool === "freehand" || activeTool === "freehandHighlight") &&
      drawPath.length >= 2
    ) {
      const pathData = drawPath
        .map(
          (point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ")
      const isHighlighterPreview = activeTool === "freehandHighlight"

      return (
        <path
          d={pathData}
          fill="none"
          stroke={selectedColor}
          strokeWidth={toolThickness}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={isHighlighterPreview ? 0.28 : 0.7}
          style={{
            pointerEvents: "none",
            ...(isHighlighterPreview
              ? { mixBlendMode: "multiply" as const }
              : {}),
          }}
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
  const overlayInteractive =
    activeTool === "select" || isDrawingTool || activeTool === "eraser"

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none absolute inset-0"
      data-annotation-overlay={pageNumber}
    >
      <svg
        width={screenW}
        height={screenH}
        viewBox={`0 0 ${screenW} ${screenH}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 size-full"
        style={{
          cursor,
          pointerEvents: overlayInteractive ? "auto" : "none",
          overflow: "visible",
        }}
        onMouseDown={
          isDrawingTool ? (event) => void handleSvgMouseDown(event) : undefined
        }
        onMouseMove={isDrawingTool ? handleSvgMouseMove : undefined}
        onMouseUp={isDrawingTool ? () => void handleSvgMouseUp() : undefined}
        onPointerDown={
          activeTool === "eraser" ? handleEraserPointerDown : undefined
        }
        onPointerMove={
          activeTool === "eraser" ? handleEraserPointerMove : undefined
        }
        onPointerUp={
          activeTool === "eraser" ? handleEraserPointerEnd : undefined
        }
        onPointerCancel={
          activeTool === "eraser" ? handleEraserPointerEnd : undefined
        }
        onPointerLeave={
          activeTool === "eraser" ? handleEraserPointerEnd : undefined
        }
        onClick={(event) => {
          if ((event.target as Element).closest("[data-annotation]")) {
            return
          }
          setContextMenu(null)
        }}
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
              className="flex w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={async () => {
                const text =
                  contextMenu.annotation.positionData.kind === "TEXT"
                    ? contextMenu.annotation.positionData.anchor.quotedText
                    : (contextMenu.annotation.content ?? "")
                await navigator.clipboard.writeText(text)
                setContextMenu(null)
                toast.success("Copied text")
              }}
            >
              Copy text
            </button>
          ) : null}
          <div className="rounded-lg px-2.5 py-2">
            <p className="mb-2 text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
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
            className="flex w-full rounded-lg px-2.5 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
