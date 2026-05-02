"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import type { 
  AnnotationWithTags, 
  PositionData, 
  TextAnchor,
  TextRect
} from "@/features/annotations/types"
import { 
  isMovablePosition, 
  isResizablePosition, 
  translatePositionData,
  resizePositionData,
  rotatePositionData,
  simplifyPath,
  type ResizeHandle
} from "@/features/annotations/geometry"
import { 
  screenToSrc, 
  srcToScreen,
  TOOL_TO_TYPE 
} from "@/features/annotations/types"
import { resolveTextAnchor } from "@/features/annotations/reanchor"
import { 
  useListByDocumentQuery, 
  useCreateAnnotationMutation, 
  useDeleteAnnotationMutation, 
  useUpdateAnnotationMutation 
} from "@/features/annotations/api"
import { useAnnotationManager } from "@/features/annotations/use-annotation-manager"
import { useViewer, useViewerStore } from "@/features/viewer/provider"
import { useAppSelector } from "@/store/hooks"
import { 
  getScreenBounds, 
  segmentTouchesBounds 
} from "./utils"
import type { 
  AnnotationOverlayProps, 
  ResolvedAnnotationMeta, 
  ManipulationState,
  SelectionInfo,
  DrawRect,
  ArrowDraw,
  ContextMenuState
} from "./types"

const HOVER_DELAY_MS = 150

export function useCoarsePointer() {
  const [coarsePointer, setCoarsePointer] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarsePointer(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return coarsePointer
}

export function useOverlayLogic(props: AnnotationOverlayProps) {
  const { 
    documentId, 
    pageNumber, 
    zoom, 
    rotation, 
    srcW, 
    srcH, 
    textLayerGenerationKey, 
    textLayerReadyKey 
  } = props

  const { data: allAnnotations = [] } = useListByDocumentQuery(documentId)
  const [createAnnotation] = useCreateAnnotationMutation()
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const [updateAnnotation] = useUpdateAnnotationMutation()
  const { addAnnotation } = useAnnotationManager(documentId)

  const activeTool = useViewer((state) => state.activeTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const toolThickness = useViewer((state) => state.toolThickness)
  const hoveredAnnotationId = useViewer((state) => state.hoveredAnnotationId)
  const selectedAnnotationId = useViewer((state) => state.rightPanelAnnotationId)
  const relocatingAnnotationId = useViewer((state) => state.relocatingAnnotationId)
  
  const setHoveredAnnotation = useViewer((state) => state.setHoveredAnnotation)
  const openAnnotation = useViewer((state) => state.openAnnotation)
  const cancelRelocatingAnnotation = useViewer((state) => state.cancelRelocatingAnnotation)
  const setSelectedColor = useViewer((state) => state.setSelectedColor)
  const pushUndo = useViewer((state) => state.pushUndo)
  const setAnnotationOrphaned = useViewer((state) => state.setAnnotationOrphaned)
  const editingAnnotationId = useViewer((state) => state.editingAnnotationId)
  const setEditingAnnotation = useViewer((state) => state.setEditingAnnotation)

  const draft = useViewer((state) => state.draft)
  const discardDraft = useViewer((state) => state.discardDraft)
  const store = useViewerStore()
  const currentUser = useAppSelector((state) => state.auth.user)

  const coarsePointer = useCoarsePointer()
  const overlayRef = useRef<HTMLDivElement>(null)

  const pageAnnotations = useMemo(
    () => allAnnotations.filter((a) => a.pageNumber === pageNumber),
    [allAnnotations, pageNumber]
  )

  const hoveredAnnotation = useMemo(
    () => pageAnnotations.find((a) => a.id === hoveredAnnotationId),
    [pageAnnotations, hoveredAnnotationId]
  )

  const [resolvedMap, setResolvedMap] = useState<Record<string, ResolvedAnnotationMeta>>({})
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null)
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null)
  const [drawRect, setDrawRect] = useState<DrawRect | null>(null)
  const [drawPath, setDrawPath] = useState<Array<{ x: number; y: number }>>([])
  const [arrowDraw, setArrowDraw] = useState<ArrowDraw | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [livePositions, setLivePositions] = useState<Record<string, PositionData>>({})

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
      if (!(annotationId in previous)) return previous
      const next = { ...previous }
      delete next[annotationId]
      livePositionsRef.current = next
      return next
    })
  }, [])

  const getEffectivePositionData = useCallback((annotation: AnnotationWithTags) => {
    return (
      livePositionsRef.current[annotation.id] ??
      resolvedMap[annotation.id]?.positionData ??
      annotation.positionData
    )
  }, [resolvedMap])

  const canEditAnnotation = useCallback((annotation: AnnotationWithTags) => {
    if (!currentUser) return false
    return (
      annotation.author?.id === currentUser.id ||
      annotation.userId === currentUser.id ||
      annotation.userId === "optimistic" ||
      annotation.userId === "local"
    )
  }, [currentUser])

  const relocateTextAnnotation = useCallback(
    async (anchor: TextAnchor) => {
      const target = pageAnnotations.find((a) => a.id === relocatingAnnotationId)
      if (!target || target.positionData.kind !== "TEXT") return

      const updated = await updateAnnotation({
        id: target.id,
        documentId,
        positionData: {
          kind: "TEXT",
          pageNumber,
          anchor,
        },
      }).unwrap()

      pushUndo({ action: "update", before: target, after: updated })
      setAnnotationOrphaned(target.id, false)
      cancelRelocatingAnnotation()
      openAnnotation(target.id)
      toast.success("Annotation relocated")
    },
    [cancelRelocatingAnnotation, documentId, openAnnotation, pageAnnotations, pageNumber, pushUndo, relocatingAnnotationId, setAnnotationOrphaned, updateAnnotation]
  )

  const restoreDeletedAnnotation = useCallback(
    async (annotation: AnnotationWithTags) => {
      await createAnnotation({
        documentId,
        pageNumber: annotation.pageNumber,
        type: annotation.type,
        color: annotation.color,
        positionData: annotation.positionData,
        ...(annotation.content ? { content: annotation.content } : {}),
      }).unwrap()
    },
    [createAnnotation, documentId]
  )

  const deleteAnnotationImmediate = useCallback(
    (annotation: AnnotationWithTags, options?: { showToast?: boolean }) => {
      if (erasedAnnotationIdsRef.current.has(annotation.id)) return
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
                onClick: () => { void restoreDeletedAnnotation(annotation) },
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

  const eraseAtPoint = useCallback(
    (point: { x: number; y: number }, previousPoint?: { x: number; y: number } | null) => {
      const segmentStart = previousPoint ?? point
      const eraserRadius = Math.max(8, toolThickness)

      pageAnnotations.forEach((annotation) => {
        if (!canEditAnnotation(annotation)) return
        const bounds = getScreenBounds(getEffectivePositionData(annotation), srcW, srcH, zoom, rotation)
        if (!bounds) return

        if (segmentTouchesBounds(segmentStart, point, bounds, eraserRadius)) {
          deleteAnnotationImmediate(annotation, { showToast: false })
        }
      })
    },
    [canEditAnnotation, deleteAnnotationImmediate, getEffectivePositionData, pageAnnotations, rotation, srcH, srcW, toolThickness, zoom]
  )

  function beginManipulation(
    annotation: AnnotationWithTags,
    mode: "move" | "resize",
    clientX: number,
    clientY: number,
    handle?: ResizeHandle
  ) {
    const originalPosition = getEffectivePositionData(annotation)
    if (mode === "move" && !isMovablePosition(originalPosition)) return
    if (mode === "resize" && (!handle || !isResizablePosition(originalPosition))) return

    manipulationRef.current = {
      annotation,
      mode,
      handle,
      startSrc: getSourcePointFromClient(clientX, clientY),
      startClient: { x: clientX, y: clientY },
      originalPosition,
      centerSrc: (originalPosition.kind === "RECT" || originalPosition.kind === "TEXT_BOX" || originalPosition.kind === "SIGNATURE" || originalPosition.kind === "IMAGE" || originalPosition.kind === "CLOUD") 
        ? { x: (originalPosition as any).x + (originalPosition as any).width / 2, y: (originalPosition as any).y + (originalPosition as any).height / 2 }
        : undefined
    }
    movedDuringManipulationRef.current = false
    openAnnotation(annotation.id)
    setContextMenu(null)
    setHoveredAnnotation(null)
  }

  const handleAnnotationActivate = useCallback(
    async (annotation: AnnotationWithTags) => {
      if (activeTool === "eraser") {
        deleteAnnotationImmediate(annotation)
        return
      }

      if (activeTool === "select" || activeTool === "hand") {
        openAnnotation(annotation.id)
      }
    },
    [activeTool, deleteAnnotationImmediate, openAnnotation]
  )

  // Duplication Intent
  const duplicationIntentId = useViewer((s) => (s as any).duplicationIntentId)
  useEffect(() => {
    if (duplicationIntentId) {
      const ann = allAnnotations.find((a) => a.id === duplicationIntentId)
      if (ann) {
        addAnnotation({
          documentId,
          pageNumber: ann.pageNumber,
          type: ann.type,
          color: ann.color,
          content: ann.content ?? undefined,
          positionData: translatePositionData(ann.positionData, { x: 20, y: 20 }, srcW, srcH),
        })
      }
      (useViewerStore as any).getState().duplicateAnnotation(null as any)
    }
  }, [duplicationIntentId, allAnnotations, addAnnotation, documentId, srcW, srcH])

  // Context Menu Cleanup
  useEffect(() => {
    function closeMenu() { setContextMenu(null) }
    window.addEventListener("click", closeMenu)
    window.addEventListener("scroll", closeMenu, true)
    window.addEventListener("resize", closeMenu)
    return () => {
      window.removeEventListener("click", closeMenu)
      window.removeEventListener("scroll", closeMenu, true)
      window.removeEventListener("resize", closeMenu)
    }
  }, [])

  // Text Selection
  useEffect(() => {
    const isTextSelectionAllowed = ["select", "hand", "highlight", "underline", "strikethrough", "squiggly"].includes(activeTool)
    if (!isTextSelectionAllowed) {
      setSelectionInfo(null)
      return
    }

    function onSelectionEnd() {
      const selection = window.getSelection()
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return

      const range = selection.getRangeAt(0)
      const rects = Array.from(range.getClientRects())
      if (rects.length === 0 || !overlayRef.current) return

      const overlayRect = overlayRef.current.getBoundingClientRect()
      const firstRect = rects[0]

      // Determine if this selection actually belongs to this page's overlay
      const isIntersecting = !(
        firstRect.bottom < overlayRect.top ||
        firstRect.top > overlayRect.bottom ||
        firstRect.right < overlayRect.left ||
        firstRect.left > overlayRect.right
      )

      if (!isIntersecting) {
        return // Selection is on another page
      }

      const sourceRects: TextRect[] = rects.map((rect) => {
        const relX = rect.left - overlayRect.left
        const relY = rect.top - overlayRect.top
        const srcPoint = screenToSrc(relX, relY, srcW, srcH, zoom, rotation)
        return { x: srcPoint.x, y: srcPoint.y, width: rect.width / zoom, height: rect.height / zoom }
      })

      const anchor = { rects: sourceRects, quotedText: selection.toString().slice(0, 5000), prefix: "", suffix: "" }

      if (relocatingAnnotationId) {
        void relocateTextAnnotation(anchor)
        window.getSelection()?.removeAllRanges()
        setSelectionInfo(null)
        return
      }

      const annotationType = TOOL_TO_TYPE[activeTool as keyof typeof TOOL_TO_TYPE]
      if (annotationType && annotationType !== "TEXTBOX") {
        addAnnotation({
          documentId,
          pageNumber,
          type: annotationType,
          color: selectedColor,
          positionData: { kind: "TEXT", pageNumber, anchor },
        })
        window.getSelection()?.removeAllRanges()
        setSelectionInfo(null)
        return
      }

      setSelectionInfo({
        anchor,
        pos: {
          x: firstRect.left - overlayRect.left + firstRect.width / 2,
          y: firstRect.top - overlayRect.top,
        },
      })
    }

    document.addEventListener("mouseup", onSelectionEnd)
    return () => document.removeEventListener("mouseup", onSelectionEnd)
  }, [activeTool, addAnnotation, documentId, pageNumber, relocateTextAnnotation, relocatingAnnotationId, rotation, selectedColor, srcH, srcW, zoom])

  // Re-anchoring
  useEffect(() => {
    if (!overlayRef.current) return
    const textLayerReady = textLayerReadyKey === textLayerGenerationKey
    const textLayer = overlayRef.current.parentElement?.querySelector<HTMLElement>(`[data-text-layer="${pageNumber}"]`)

    setResolvedMap((previous) => {
      const nextResolved: Record<string, ResolvedAnnotationMeta> = {}
      pageAnnotations.forEach((annotation) => {
        if (annotation.positionData.kind !== "TEXT") {
          nextResolved[annotation.id] = { positionData: annotation.positionData, orphaned: false }
          setAnnotationOrphaned(annotation.id, false)
          return
        }

        const fallback = previous[annotation.id] ?? { positionData: annotation.positionData, orphaned: false }
        if (!textLayerReady || !textLayer) {
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
          return
        }

        const spanNodes = Array.from(textLayer.querySelectorAll<HTMLElement>("[data-text-span='true']"))
        if (spanNodes.length === 0) {
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
          return
        }

        try {
          const overlayRect = overlayRef.current!.getBoundingClientRect()
          const segments = spanNodes.map((span) => {
            const spanRect = span.getBoundingClientRect()
            const srcPoint = screenToSrc(spanRect.left - overlayRect.left, spanRect.top - overlayRect.top, srcW, srcH, zoom, rotation)
            return {
              text: span.dataset.textContent ?? span.textContent ?? "",
              rect: { x: srcPoint.x, y: srcPoint.y, width: spanRect.width / zoom, height: spanRect.height / zoom },
            }
          })

          const reanchored = resolveTextAnchor(segments, annotation.positionData.anchor)
          nextResolved[annotation.id] = {
            positionData: {
              kind: "TEXT",
              pageNumber: annotation.positionData.pageNumber,
              anchor: { ...annotation.positionData.anchor, rects: reanchored.rects },
            },
            orphaned: reanchored.orphaned,
          }
          setAnnotationOrphaned(annotation.id, reanchored.orphaned)
        } catch (error) {
          nextResolved[annotation.id] = fallback
          setAnnotationOrphaned(annotation.id, fallback.orphaned)
        }
      })
      return nextResolved
    })
  }, [pageAnnotations, pageNumber, rotation, setAnnotationOrphaned, srcH, srcW, textLayerGenerationKey, textLayerReadyKey, zoom])

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const currentPoint = getRelativeClientPoint(event.clientX, event.clientY)
      const currentSrc = getSourcePointFromClient(event.clientX, event.clientY)

      if (erasingRef.current) {
        eraseAtPoint(currentPoint, lastEraserPointRef.current)
        lastEraserPointRef.current = currentPoint
        return
      }

      if (drawingRef.current && startPosRef.current) {
        if (activeTool === "freehand" || activeTool === "freehandHighlight") {
          setDrawPath((previous) => [...previous, currentSrc])
        } else if (activeTool === "arrow") {
          setArrowDraw({ from: startPosRef.current, to: currentSrc })
        } else if (["rectangle", "circle", "redact", "cloud"].includes(activeTool)) {
          setDrawRect({
            x: Math.min(startPosRef.current.x, currentSrc.x),
            y: Math.min(startPosRef.current.y, currentSrc.y),
            w: Math.abs(currentSrc.x - startPosRef.current.x),
            h: Math.abs(currentSrc.y - startPosRef.current.y),
          })
        }
        return
      }

      if (manipulationRef.current) {
        movedDuringManipulationRef.current = true
        const state = manipulationRef.current
        const nextPosition = state.mode === "move"
          ? translatePositionData(state.originalPosition, { x: currentSrc.x - state.startSrc.x, y: currentSrc.y - state.startSrc.y }, srcW, srcH)
          : state.handle === "rot" && state.centerSrc
            ? rotatePositionData(state.originalPosition, currentSrc, state.centerSrc)
            : resizePositionData(state.originalPosition, state.handle!, currentSrc, zoom, srcW, srcH)

        setLivePosition(state.annotation.id, nextPosition)
        return
      }

      if (!coarsePointer) {
        const target = (event.target as HTMLElement).closest("[data-annotation]")
        if (target) {
          const id = target.getAttribute("data-annotation")
          if (id && id !== hoveredIdRef.current) {
            hoveredIdRef.current = id
            if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
            hoverTimerRef.current = setTimeout(() => {
              setHoveredAnnotation(id)
              setHoverPos(currentPoint)
            }, HOVER_DELAY_MS)
          } else if (id === hoveredIdRef.current) {
            setHoverPos(currentPoint)
          }
        } else if (hoveredIdRef.current) {
          if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
          hoveredIdRef.current = null
          setHoveredAnnotation(null)
          setHoverPos(null)
        }
      }
    },
    [activeTool, coarsePointer, eraseAtPoint, getRelativeClientPoint, getSourcePointFromClient, rotation, setHoveredAnnotation, setLivePosition, srcH, srcW, zoom]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (event.button !== 0) return
      const point = getSourcePointFromClient(event.clientX, event.clientY)
      const relative = getRelativeClientPoint(event.clientX, event.clientY)

      if (activeTool === "eraser") {
        erasingRef.current = true
        lastEraserPointRef.current = relative
        erasedAnnotationIdsRef.current.clear()
        eraseAtPoint(relative)
        return
      }

      if (["freehand", "freehandHighlight", "rectangle", "circle", "arrow", "redact", "cloud"].includes(activeTool)) {
        drawingRef.current = true
        startPosRef.current = point
        if (activeTool === "freehand" || activeTool === "freehandHighlight") setDrawPath([point])
        return
      }

      if (activeTool === "textbox") {
        const localId = addAnnotation({
          documentId,
          pageNumber,
          type: "TEXTBOX",
          color: selectedColor,
          positionData: { kind: "TEXT_BOX", x: point.x, y: point.y, width: 150, height: 40, pageNumber, fontSize: 14, fontFamily: "font-sans" },
          content: "",
        })
        // Switch to select tool so the user can type in the new textbox
        store.getState().setTool("select")
        setEditingAnnotation(localId)
        return
      }

      if (activeTool === "note") {
        addAnnotation({
          documentId,
          pageNumber,
          type: "NOTE",
          color: selectedColor,
          positionData: { kind: "POINT", x: point.x, y: point.y, pageNumber },
          content: "",
        })
        return
      }
      
      if (activeTool === "checkmark" || activeTool === "cross" || activeTool === "stamp") {
        const type = activeTool === "checkmark" ? "CHECKMARK" : activeTool === "cross" ? "CROSS" : "STAMP"
        const size = 28
        addAnnotation({
          documentId,
          pageNumber,
          type,
          color: selectedColor,
          positionData: { kind: "RECT", x: point.x - size / 2, y: point.y - size / 2, width: size, height: size, pageNumber },
        })
        return
      }
    },
    [activeTool, addAnnotation, documentId, eraseAtPoint, getRelativeClientPoint, getSourcePointFromClient, pageNumber, selectedColor]
  )

  const handlePointerUp = useCallback(
    async (event: React.PointerEvent) => {
      if (erasingRef.current) {
        erasingRef.current = false
        lastEraserPointRef.current = null
        return
      }

      if (drawingRef.current && startPosRef.current) {
        drawingRef.current = false
        const endPos = getSourcePointFromClient(event.clientX, event.clientY)
        const type = TOOL_TO_TYPE[activeTool as keyof typeof TOOL_TO_TYPE]

        if (type === "FREEHAND") {
          if (drawPath.length > 2) {
            addAnnotation({
              documentId,
              pageNumber,
              type: "FREEHAND",
              color: selectedColor as string,
              positionData: { kind: "PATH", points: simplifyPath(drawPath), strokeWidth: toolThickness, pageNumber, style: activeTool === "freehandHighlight" ? "highlighter" : "pen" },
            })
          }
        } else if (type === "ARROW") {
          addAnnotation({
            documentId,
            pageNumber,
            type: "ARROW",
            color: selectedColor as string,
            positionData: { kind: "ARROW", from: startPosRef.current, to: endPos, strokeWidth: toolThickness, pageNumber },
          })
        } else if (["RECTANGLE", "CIRCLE", "REDACTION", "CLOUD"].includes(type as string)) {
          const width = Math.abs(endPos.x - startPosRef.current.x)
          const height = Math.abs(endPos.y - startPosRef.current.y)
          if (width > 4 || height > 4) {
            addAnnotation({
              documentId,
              pageNumber,
              type: type as any,
              color: type === "REDACTION" ? "#000000" : (selectedColor as string),
              positionData: {
                kind: type === "CLOUD" ? "CLOUD" : "RECT",
                x: Math.min(startPosRef.current.x, endPos.x),
                y: Math.min(startPosRef.current.y, endPos.y),
                width,
                height,
                pageNumber,
                strokeWidth: toolThickness,
              },
            })
          }
        }

        setDrawRect(null)
        setDrawPath([])
        setArrowDraw(null)
        startPosRef.current = null
        return
      }

      if (manipulationRef.current) {
        const state = manipulationRef.current
        const latestPosition = livePositionsRef.current[state.annotation.id]
        clearLivePosition(state.annotation.id)
        manipulationRef.current = null

        if (latestPosition && movedDuringManipulationRef.current) {
          const updated = await updateAnnotation({
            id: state.annotation.id,
            documentId,
            positionData: latestPosition,
          }).unwrap()
          pushUndo({ action: "update", before: state.annotation, after: updated })
        }
        movedDuringManipulationRef.current = false
      }
    },
    [activeTool, addAnnotation, documentId, drawPath, getSourcePointFromClient, pageNumber, pushUndo, selectedColor, toolThickness, updateAnnotation, clearLivePosition]
  )

  return {
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
    livePositions,
    toolThickness,
    editingAnnotationId,
    setEditingAnnotation,
    isDrawingMode: !["select", "hand", "highlight", "underline", "strikethrough", "squiggly"].includes(activeTool),
    isDrawing: !!drawRect || drawPath.length > 0 || !!arrowDraw,
    isManipulating: !!manipulationRef.current,
  }
}
