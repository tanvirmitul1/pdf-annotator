"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Plus } from "lucide-react"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"


import { useViewer, useViewerStore } from "@/features/viewer/provider"
import { PdfCanvas } from "./pdf-canvas"
import { AnnotationOverlay } from "@/components/annotations/annotation-overlay"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PdfObjectLayer } from "./pdf-object-layer"
import { type PdfObject } from "@/lib/pdf/analyzer"

interface PageDimension {
  width: number
  height: number
}

interface PdfViewerProps {
  pdfDocument: PDFDocumentProxy
  documentId: string
  pagesData?: Array<{ pageNumber: number, objects: PdfObject[] }>
  onProgressUpdate?: (page: number, percent: number) => void
}

const PAGE_GAP = 16

export function PdfViewer({
  pdfDocument,
  documentId,
  pagesData,
  onProgressUpdate,
}: PdfViewerProps) {
  const zoom = useViewer((s) => s.zoom)
  const rotation = useViewer((s) => s.rotation)
  const currentPage = useViewer((s) => s.currentPage)
  const setPage = useViewer((s) => s.setPage)
  const setTotalPages = useViewer((s) => s.setTotalPages)
  const totalPages = useViewer((s) => s.totalPages)
  const searchMatches = useViewer((s) => s.searchMatches)
  const currentMatchIndex = useViewer((s) => s.currentMatchIndex)
  const pageOrder = useViewer((s) => s.pageOrder)
  const setSelectedAnnotation = useViewer((s) => s.setSelectedAnnotation)
  const setEditingAnnotation = useViewer((s) => s.setEditingAnnotation)
  const store = useViewerStore()

  const displayPages = useMemo(() => {
    const visible = pageOrder.filter(p => !p.deleted)
    if (visible.length > 0) return visible
    return Array.from({ length: totalPages }, (_, i) => ({ 
      originalIndex: i + 1, 
      type: "original" as const, 
      rotation: 0 as const 
    }))

  }, [pageOrder, totalPages])

  const [pageDimensions, setPageDimensions] = useState<PageDimension[]>([])
  const [loadedPages, setLoadedPages] = useState<Map<number, PDFPageProxy>>(new Map())
  const [textLayerReadyByPage, setTextLayerReadyByPage] = useState<Record<number, string>>({})

  const scrollRef = useRef<HTMLDivElement>(null)
  const programmaticScrollRef = useRef(false)
  const textLayerGenerationKey = `${zoom}:${rotation}`

  const handleTextLayerReady = useCallback((pageNumber: number, generationKey: string) => {
    setTextLayerReadyByPage((prev) => prev[pageNumber] === generationKey ? prev : { ...prev, [pageNumber]: generationKey })
  }, [])

  useEffect(() => {
    setTextLayerReadyByPage({})
  }, [documentId, pdfDocument])

  useEffect(() => {
    let cancelled = false
    async function loadDimensions() {
      const count = pdfDocument.numPages
      setTotalPages(count)
      const dims: PageDimension[] = []
      for (let i = 1; i <= count; i++) {
        if (cancelled) break
        const page = await pdfDocument.getPage(i)
        const vp = page.getViewport({ scale: 1, rotation: 0 })
        dims.push({ width: vp.width, height: vp.height })
      }
      if (!cancelled) setPageDimensions(dims)
    }
    loadDimensions()
    return () => { cancelled = true }
  }, [pdfDocument, setTotalPages])

  // Apply a 1.5x base scale factor to make 100% zoom look like 150%
  const ZOOM_SENSITIVITY = 1.5
  const displayZoom = useMemo(() => zoom * ZOOM_SENSITIVITY, [zoom])

  const getItemSize = useCallback((index: number) => {
    const pageRec = displayPages[index]
    if (!pageRec || pageRec.originalIndex === undefined || !pageDimensions[pageRec.originalIndex - 1]) {
      return 800 * displayZoom + PAGE_GAP
    }
    const dim = pageDimensions[pageRec.originalIndex - 1]
    const totalRot = (rotation + pageRec.rotation) % 360
    const isRotated = totalRot === 90 || totalRot === 270
    const h = isRotated ? dim.width : dim.height
    return Math.round(h * displayZoom) + PAGE_GAP
  }, [pageDimensions, displayZoom, rotation, displayPages])

  const virtualizer = useVirtualizer({
    count: displayPages.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: getItemSize,
    overscan: 2,
    gap: 0,
  })

  const virtualItems = virtualizer.getVirtualItems()
  useEffect(() => {
    if (!pdfDocument || pageDimensions.length === 0) return
    const toLoad = virtualItems
      .map((vi) => displayPages[vi.index]?.originalIndex)
      .filter((n): n is number => n !== undefined && !loadedPages.has(n))
    if (toLoad.length === 0) return
    let cancelled = false
    Promise.all(toLoad.map(async (n) => ({ n, page: await pdfDocument.getPage(n) })))
      .then((results) => {
        if (cancelled) return
        setLoadedPages((prev) => {
          const next = new Map(prev)
          results.forEach(({ n, page }) => next.set(n, page))
          return next
        })
      })
    return () => { cancelled = true }
  }, [virtualItems, pdfDocument, pageDimensions, loadedPages, displayPages])

  useEffect(() => {
    if (currentPage < 1 || currentPage > totalPages) return
    programmaticScrollRef.current = true
    virtualizer.scrollToIndex(currentPage - 1, { align: "start" })
    setTimeout(() => { programmaticScrollRef.current = false }, 200)
  }, [currentPage, totalPages, virtualizer])

  const currentMatch = searchMatches[currentMatchIndex]
  useEffect(() => {
    if (!currentMatch) return
    programmaticScrollRef.current = true
    virtualizer.scrollToIndex(currentMatch.pageNumber - 1, { align: "center" })
    setTimeout(() => { programmaticScrollRef.current = false }, 200)
  }, [currentMatch, virtualizer])

  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current || !scrollRef.current) return
    const scrollTop = scrollRef.current.scrollTop
    const containerHeight = scrollRef.current.clientHeight
    const center = scrollTop + containerHeight / 2
    let accumulated = 0
    for (let i = 0; i < totalPages; i++) {
      const size = getItemSize(i)
      if (accumulated + size / 2 >= center) {
        const pageRec = displayPages[i]
        const pNum = pageRec?.originalIndex ?? i + 1
        setPage(pNum)
        onProgressUpdate?.(pNum, Math.round(((i + 1) / displayPages.length) * 100))
        return
      }
      accumulated += size
    }
  }, [totalPages, getItemSize, setPage, onProgressUpdate, displayPages])

  // Ctrl+Scroll → PDF zoom (prevent browser zoom)
  const setZoomAction = useViewer((s) => s.setZoom)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Check if Ctrl or Meta key is pressed
      if (!e.ctrlKey && !e.metaKey) return
      
      // Only block if we are over the viewer area to avoid blocking browser zoom on other UI
      if (!scrollRef.current?.contains(e.target as Node)) return
      
      // Prevent browser default zoom
      e.preventDefault()
      
      // Update our internal zoom
      const currentZoom = store.getState().zoom
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newZoom = Math.round(Math.max(0.25, Math.min(4, currentZoom + delta)) * 100) / 100
      setZoomAction(newZoom)
    }

    // Attach to window to reliably catch Ctrl+Scroll and prevent browser zoom
    window.addEventListener("wheel", handleWheel, { passive: false })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [setZoomAction, store])

  const handleTextClick = useCallback((text: string, rect: DOMRect, pageNum: number) => {
    const pageContainer = scrollRef.current?.querySelector(`[data-testid="pdf-page-${pageNum}"]`)
    if (!pageContainer) return
    const containerRect = pageContainer.getBoundingClientRect()
    const state = store.getState()
    state.startDraft({
      type: "editText",
      pageNumber: pageNum,
      color: state.selectedColor,
      isDirect: true,
      positionData: {
        kind: "TEXT_BOX",
        pageNumber: pageNum,
        x: (rect.left - containerRect.left) / displayZoom,
        y: (rect.top - containerRect.top) / displayZoom,
        width: rect.width / displayZoom,
        height: rect.height / displayZoom,
        fontSize: (rect.height / displayZoom) * 0.8,
        fontFamily: "Inter",
        textAlign: "left",
      },
      content: text,
    })
  }, [displayZoom, store])


  if (pageDimensions.length === 0) {
    return <div className="flex flex-1 items-center justify-center bg-background"><div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" /></div>
  }

  return (
    <ScrollArea className="h-full w-full" viewportRef={scrollRef} viewportProps={{ onScroll: handleScroll, tabIndex: -1 }}>
      <div 
        className="flex flex-col items-center py-8" 
        style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}
        onClick={() => {
          setSelectedAnnotation(null)
          setEditingAnnotation(null)
        }}
      >
        {virtualItems.map((vi) => {
          const pageRec = displayPages[vi.index]
          if (!pageRec) return null
          
          const isBlank = pageRec.type === "blank"
          const pageNum = pageRec.originalIndex
          const dim = isBlank ? { width: 612, height: 792 } : (pageNum ? pageDimensions[pageNum - 1] : null)
          
          if (!dim) return null

          const totalRot = (rotation + pageRec.rotation) % 360 as 0 | 90 | 180 | 270
          const isRotated = totalRot === 90 || totalRot === 270
          const scaledW = Math.round((isRotated ? dim.height : dim.width) * displayZoom)
          const scaledH = Math.round((isRotated ? dim.width : dim.height) * displayZoom)
          const objects = (pageNum ? pagesData?.find(p => p.pageNumber === pageNum)?.objects : []) as PdfObject[]

          return (
            <div key={vi.key} data-index={vi.index} data-testid={`pdf-page-${vi.index + 1}`} style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${vi.start}px)` }}>
              <div className="flex flex-col items-center" style={{ paddingBottom: PAGE_GAP }}>
                <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">{vi.index + 1}</div>
                <div className="relative bg-white dark:bg-zinc-900 shadow-[0_0_50px_-12px_rgba(0,0,0,0.25)] dark:shadow-[0_0_50px_-12px_rgba(0,0,0,0.6)] ring-1 ring-border/5">
                  <div className="relative" style={{ width: scaledW, height: scaledH }}>
                    {!isBlank && pageNum ? (
                      <>
                        <PdfCanvas
                          page={loadedPages.get(pageNum) ?? null}
                          zoom={displayZoom}
                          rotation={totalRot}
                          active={true}
                          naturalWidth={isRotated ? dim.height : dim.width}
                          naturalHeight={isRotated ? dim.width : dim.height}
                          textLayerGenerationKey={`${textLayerGenerationKey}:${pageRec.rotation}`}
                          onTextLayerReady={handleTextLayerReady}
                          onTextClick={handleTextClick}
                          searchMatches={searchMatches.filter(m => m.pageNumber === pageNum)}
                          isCurrentMatch={currentMatch?.pageNumber === pageNum}
                        />
                        <PdfObjectLayer pageNumber={pageNum} objects={objects} zoom={displayZoom} rotation={totalRot} screenWidth={scaledW} screenHeight={scaledH} />
                        <AnnotationOverlay documentId={documentId} pageNumber={pageNum} zoom={displayZoom} rotation={totalRot} srcW={dim.width} srcH={dim.height} screenW={scaledW} screenH={scaledH} textLayerGenerationKey={`${textLayerGenerationKey}:${pageRec.rotation}`} textLayerReadyKey={textLayerReadyByPage[pageNum] ?? null} />
                      </>
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center bg-muted/5 border-2 border-dashed border-border/10">
                        <Plus className="size-10 text-muted-foreground/20" />
                        <span className="mt-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/30">Blank Page</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

      </div>
    </ScrollArea>
  )
}
