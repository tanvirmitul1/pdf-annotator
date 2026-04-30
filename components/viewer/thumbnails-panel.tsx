"use client"

import { useRef, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PDFDocumentProxy } from "pdfjs-dist"

import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"

interface ThumbnailsPanelProps {
  pdfDocument: PDFDocumentProxy
  totalPages: number
}

const THUMB_HEIGHT = 110

export function ThumbnailsPanel({
  pdfDocument,
  totalPages,
}: ThumbnailsPanelProps) {
  const currentPage = useViewer((s) => s.currentPage)
  const setPage = useViewer((s) => s.setPage)
  const pageOrder = useViewer((s) => s.pageOrder)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)
  const containerRef = useRef<HTMLDivElement>(null)

  const visiblePages = pageOrder.filter(p => !p.deleted)
  const displayPages = visiblePages.length > 0 ? visiblePages : Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i + 1, rotation: 0 as const }))

  const virtualizer = useVirtualizer({
    count: displayPages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => THUMB_HEIGHT + 8,
    overscan: 3,
  })

  // Scroll to current page in sidebar
  useEffect(() => {
    virtualizer.scrollToIndex(currentPage - 1, { align: "center" })
  }, [currentPage, virtualizer])

  return (
    <div className="flex flex-col h-full bg-background/50">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/30">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pages</span>
        <button 
          onClick={() => setSidebarTab("organize")}
          className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
        >
          Organize
        </button>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const pageRecord = displayPages[vi.index]
            const pageNum = pageRecord.originalIndex
            const isCurrent = pageNum === currentPage

            return (
              <div
                key={vi.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vi.start}px)`,
                  padding: "4px 8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setPage(pageNum)}
                  aria-label={`Go to page ${pageNum}`}
                  className={cn(
                    "w-full cursor-pointer overflow-hidden rounded border bg-card transition-all duration-150",
                    "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                    "hover:scale-[1.02] hover:border-primary/60",
                    isCurrent
                      ? "border-primary ring-2 ring-primary"
                      : "border-border"
                  )}
                >
                  <div style={{ transform: `rotate(${pageRecord.rotation}deg)` }}>
                    <ThumbnailCanvas
                      pdfDocument={pdfDocument}
                      pageNum={pageNum}
                      active={Math.abs(pageNum - currentPage) <= 5}
                    />
                  </div>
                  <div
                    className={cn(
                      "py-1 text-center text-xs",
                      isCurrent
                        ? "font-semibold text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {pageNum}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ThumbnailCanvas({
  pdfDocument,
  pageNum,
  active,
}: {
  pdfDocument: PDFDocumentProxy
  pageNum: number
  active: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!active || !canvasRef.current) return
    let cancelled = false

    async function render() {
      const page = await pdfDocument.getPage(pageNum)
      if (cancelled || !canvasRef.current) return

      const viewport = page.getViewport({ scale: 1 })
      const scale = 120 / viewport.width
      const scaledVp = page.getViewport({ scale })

      const canvas = canvasRef.current
      canvas.width = scaledVp.width
      canvas.height = scaledVp.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const task = page.render({
        canvasContext: ctx,
        viewport: scaledVp,
        canvas,
      })
      try {
        await task.promise
      } catch {
        // ignore cancelled renders
      }
    }

    render()
    return () => {
      cancelled = true
    }
  }, [pdfDocument, pageNum, active])

  if (!active) {
    return <div className="h-[90px] w-full animate-pulse bg-muted" />
  }

  return (
    <canvas
      ref={canvasRef}
      className="block w-full"
      style={{ height: THUMB_HEIGHT - 20 }}
      aria-hidden
    />
  )
}
