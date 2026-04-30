"use client"

import { useRef, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { Trash2, Copy, Plus, MoreVertical } from "lucide-react"

import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ThumbnailsPanelProps {
  pdfDocument: PDFDocumentProxy
  totalPages: number
}

const THUMB_HEIGHT = 120

export function ThumbnailsPanel({
  pdfDocument,
  totalPages,
}: ThumbnailsPanelProps) {
  const currentPage = useViewer((s) => s.currentPage)
  const setPage = useViewer((s) => s.setPage)
  const pageOrder = useViewer((s) => s.pageOrder)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)
  const deletePage = useViewer((s) => s.deletePage)
  const duplicatePage = useViewer((s) => s.duplicatePage)
  const addBlankPage = useViewer((s) => s.addBlankPage)
  const containerRef = useRef<HTMLDivElement>(null)

  const visiblePages = pageOrder.filter(p => !p.deleted)
  const displayPages = visiblePages.length > 0 ? visiblePages : Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i + 1, rotation: 0 as const }))

  const virtualizer = useVirtualizer({
    count: displayPages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => THUMB_HEIGHT + 12,
    overscan: 3,
  })

  // Scroll to current page in sidebar
  useEffect(() => {
    if (currentPage > 0 && currentPage <= displayPages.length) {
       virtualizer.scrollToIndex(currentPage - 1, { align: "center" })
    }
  }, [currentPage, virtualizer, displayPages.length])

  return (
    <div className="flex flex-col h-full bg-muted/30 backdrop-blur-sm">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/40">
        <div className="flex flex-col">
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Document</span>
           <h3 className="text-xs font-bold text-foreground/80">Thumbnails</h3>
        </div>
        <div className="flex items-center gap-1.5">
           <TooltipProvider>
              <Tooltip>
                 <TooltipTrigger asChild>
                    <Button 
                       variant="ghost" 
                       size="icon" 
                       className="size-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-all"
                       onClick={() => addBlankPage(displayPages.length - 1)}
                    >
                       <Plus className="size-4" />
                    </Button>
                 </TooltipTrigger>
                 <TooltipContent side="bottom" className="text-[10px] font-bold">Add Blank Page</TooltipContent>
              </Tooltip>
           </TooltipProvider>
           
           <Button 
              variant="secondary" 
              className="h-7 px-2.5 text-[9px] font-black uppercase tracking-tighter bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10 rounded-lg shadow-sm"
              onClick={() => setSidebarTab("organize")}
           >
              Organize
           </Button>
        </div>
      </div>

      {/* Thumbnails List */}
      <div ref={containerRef} className="flex-1 overflow-y-auto py-6 custom-scrollbar px-4">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const pageRecord = displayPages[vi.index]
            if (!pageRecord || pageRecord.originalIndex === undefined) return null
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
                  padding: "10px 0",
                }}
              >
                <div className="group relative flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1">
                     <span className={cn(
                        "text-[10px] font-black tracking-widest transition-colors",
                        isCurrent ? "text-primary" : "text-muted-foreground/40"
                     )}>
                        PAGE {pageNum}
                     </span>
                     {isCurrent && (
                        <div className="h-1 w-8 rounded-full bg-primary/40 animate-pulse" />
                     )}
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        "relative w-full cursor-pointer overflow-hidden rounded-[14px] border-2 bg-card transition-all duration-300 shadow-sm",
                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        "hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5",
                        isCurrent
                          ? "border-primary ring-4 ring-primary/5 shadow-primary/10"
                          : "border-border/40"
                      )}
                    >
                      <div className="aspect-[3/4] w-full bg-white dark:bg-zinc-900/50" style={{ transform: `rotate(${pageRecord.rotation}deg)` }}>
                        <ThumbnailCanvas
                          pdfDocument={pdfDocument}
                          pageNum={pageNum}
                          active={Math.abs(pageNum - currentPage) <= 8}
                        />
                      </div>
                    </button>
                    
                    {/* Page Actions Overlay (Floating) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 z-10">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                             <Button variant="secondary" size="icon" className="size-7 rounded-xl shadow-2xl bg-background/90 backdrop-blur-md border border-border/40 hover:scale-105 active:scale-95">
                                <MoreVertical className="size-3.5" />
                             </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36 rounded-xl p-1.5 border-border/40 shadow-2xl backdrop-blur-2xl">
                             <DropdownMenuItem onClick={() => duplicatePage(vi.index)} className="rounded-lg gap-2 text-[11px] font-bold">
                                <Copy className="size-3.5 text-muted-foreground" />
                                <span>Duplicate</span>
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => addBlankPage(vi.index)} className="rounded-lg gap-2 text-[11px] font-bold">
                                <Plus className="size-3.5 text-muted-foreground" />
                                <span>Insert Blank</span>
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="opacity-40" />
                             <DropdownMenuItem 
                                onClick={() => deletePage(vi.index)} 
                                className="rounded-lg gap-2 text-[11px] font-black text-destructive focus:text-destructive focus:bg-destructive/10"
                             >
                                <Trash2 className="size-3.5" />
                                <span>Remove Page</span>
                             </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </div>
                </div>
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
