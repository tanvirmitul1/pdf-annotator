"use client"

import { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"

import { useViewer } from "@/features/viewer/provider"
import type { SearchMatch } from "@/features/viewer/store"
import { PdfCanvas } from "./pdf-canvas"
import { AnnotationOverlay } from "@/components/annotations/annotation-overlay"

interface PageDimension {
  width: number
  height: number
}

interface PdfViewerProps {
  pdfDocument: PDFDocumentProxy
  documentId: string
  onProgressUpdate?: (page: number, percent: number) => void
}

const PAGE_GAP = 16

export function PdfViewer({
  pdfDocument,
  documentId,
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
  const activeTool = useViewer((s) => s.activeTool)

  const [pageDimensions, setPageDimensions] = useState<PageDimension[]>([])
  const [loadedPages, setLoadedPages] = useState<Map<number, PDFPageProxy>>(
    new Map()
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const programmaticScrollRef = useRef(false)
  const currentMatchRef = useRef(currentMatchIndex)
  currentMatchRef.current = currentMatchIndex

  // Load page dimensions (at rotation=0, zoom=1)
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
    return () => {
      cancelled = true
    }
  }, [pdfDocument, setTotalPages])

  // Compute item sizes for virtualizer (height includes gap)
  const getItemSize = useCallback(
    (index: number) => {
      if (!pageDimensions[index]) return 800 * zoom + PAGE_GAP
      const dim = pageDimensions[index]
      const isRotated = rotation === 90 || rotation === 270
      const h = isRotated ? dim.width : dim.height
      return Math.round(h * zoom) + PAGE_GAP
    },
    [pageDimensions, zoom, rotation]
  )

  const virtualizer = useVirtualizer({
    count: totalPages,
    getScrollElement: () => scrollRef.current,
    estimateSize: getItemSize,
    overscan: 2,
    gap: 0,
  })

  // Load pages that are in the virtual window
  const virtualItems = virtualizer.getVirtualItems()
  useEffect(() => {
    if (!pdfDocument || pageDimensions.length === 0) return

    const toLoad = virtualItems
      .map((vi) => vi.index + 1)
      .filter((n) => !loadedPages.has(n))

    if (toLoad.length === 0) return

    let cancelled = false
    Promise.all(
      toLoad.map(async (pageNum) => {
        const page = await pdfDocument.getPage(pageNum)
        return { pageNum, page }
      })
    ).then((results) => {
      if (cancelled) return
      setLoadedPages((prev) => {
        const next = new Map(prev)
        results.forEach(({ pageNum, page }) => next.set(pageNum, page))
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [virtualItems, pdfDocument, pageDimensions, loadedPages])

  // Scroll to current page when changed externally
  useEffect(() => {
    if (currentPage < 1 || currentPage > totalPages) return
    programmaticScrollRef.current = true
    virtualizer.scrollToIndex(currentPage - 1, { align: "start" })
    setTimeout(() => {
      programmaticScrollRef.current = false
    }, 200)
  }, [currentPage, totalPages, virtualizer])

  // Scroll to current search match
  const currentMatch = searchMatches[currentMatchIndex]
  useEffect(() => {
    if (!currentMatch) return
    const pageIndex = currentMatch.pageNumber - 1
    programmaticScrollRef.current = true
    virtualizer.scrollToIndex(pageIndex, { align: "center" })
    setTimeout(() => {
      programmaticScrollRef.current = false
    }, 200)
  }, [currentMatch, virtualizer])

  // Update current page on scroll
  const handleScroll = useCallback(() => {
    if (programmaticScrollRef.current || !scrollRef.current) return
    const scrollTop = scrollRef.current.scrollTop
    const containerHeight = scrollRef.current.clientHeight

    const center = scrollTop + containerHeight / 2
    let accumulated = 0
    for (let i = 0; i < totalPages; i++) {
      const size = getItemSize(i)
      if (accumulated + size / 2 >= center) {
        setPage(i + 1)
        const percent =
          totalPages > 1 ? Math.round(((i + 1) / totalPages) * 100) : 100
        onProgressUpdate?.(i + 1, percent)
        return
      }
      accumulated += size
    }
    setPage(totalPages)
  }, [totalPages, getItemSize, setPage, onProgressUpdate])

  // Max page width for centering
  const maxPageWidth = useMemo(() => {
    if (pageDimensions.length === 0) return 600
    const isRotated = rotation === 90 || rotation === 270
    return Math.round(
      Math.max(...pageDimensions.map((d) => (isRotated ? d.height : d.width))) *
        zoom
    )
  }, [pageDimensions, zoom, rotation])

  // Change cursor for annotation tools
  const cursorStyle = useMemo(() => {
    if (activeTool === "select") return "default"
    if (activeTool === "eraser") return "cell"
    if (
      activeTool === "note" ||
      activeTool === "textbox" ||
      activeTool === "freehand" ||
      activeTool === "rectangle" ||
      activeTool === "circle" ||
      activeTool === "arrow"
    )
      return "crosshair"
    return "text"
  }, [activeTool])

  if (pageDimensions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_8%,transparent)_0,transparent_40%)]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,color-mix(in_oklab,var(--background)_96%,white)_0%,color-mix(in_oklab,var(--muted)_65%,transparent)_100%)]"
      onScroll={handleScroll}
      tabIndex={-1}
      style={{ cursor: cursorStyle }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: "relative",
        }}
      >
        {virtualItems.map((vi) => {
          const pageNum = vi.index + 1
          const dim = pageDimensions[vi.index]
          if (!dim) return null

          const isRotated = rotation === 90 || rotation === 270
          const naturalW = isRotated ? dim.height : dim.width
          const naturalH = isRotated ? dim.width : dim.height

          const scaledW = Math.round(naturalW * zoom)
          const scaledH = Math.round(naturalH * zoom)

          // Source dims (rotation=0, zoom=1)
          const srcW = dim.width
          const srcH = dim.height

          const pageMatches = searchMatches.filter(
            (m: SearchMatch) => m.pageNumber === pageNum
          )
          const isCurrentMatchPage = currentMatch?.pageNumber === pageNum

          return (
            <div
              key={vi.key}
              data-index={vi.index}
              data-testid={`pdf-page-${pageNum}`}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${vi.start}px)`,
              }}
            >
              <div
                className="flex flex-col items-center"
                style={{ paddingBottom: PAGE_GAP }}
              >
                {/* Page number label */}
                <div className="mb-1 text-xs text-muted-foreground">
                  {pageNum}
                </div>

                {/* Page card */}
                <div
                  className="relative rounded-[1.4rem] bg-white/70 p-2 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.65)] dark:bg-black/12"
                  style={{ maxWidth: maxPageWidth }}
                >
                  <div className="relative" style={{ width: scaledW, height: scaledH }}>
                    <PdfCanvas
                      page={loadedPages.get(pageNum) ?? null}
                      zoom={zoom}
                      rotation={rotation}
                      active={true}
                      naturalWidth={naturalW}
                      naturalHeight={naturalH}
                      searchMatches={pageMatches}
                      isCurrentMatch={isCurrentMatchPage}
                    />

                    {/* Annotation overlay */}
                    <AnnotationOverlay
                      documentId={documentId}
                      pageNumber={pageNum}
                      zoom={zoom}
                      rotation={rotation}
                      srcW={srcW}
                      srcH={srcH}
                      screenW={scaledW}
                      screenH={scaledH}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
