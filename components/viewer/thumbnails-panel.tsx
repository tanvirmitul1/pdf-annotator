"use client"

import { useRef, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { Trash2, Copy, Plus, RotateCw, Check, FileUp, MoreVertical } from "lucide-react"

import { useViewer, useViewerStore } from "@/features/viewer/provider"
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
  const rotatePage = useViewer((s) => s.rotatePage)
  const documentId = useViewer((s) => s.documentId)
  
  const selectedPageIndices = useViewer((s) => s.selectedPageIndices || [])
  const togglePageSelection = useViewer((s) => (s as any).togglePageSelection)
  const clearPageSelection = useViewer((s) => (s as any).clearPageSelection)

  const containerRef = useRef<HTMLDivElement>(null)

  const visiblePages = pageOrder.filter(p => !p.deleted)
  const displayPages = visiblePages.length > 0 ? visiblePages : Array.from({ length: totalPages }, (_, i) => ({ originalIndex: i + 1, rotation: 0 as const }))

  const virtualizer = useVirtualizer({
    count: displayPages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => THUMB_HEIGHT + 40, // Increased for spacing and footer
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
      <div ref={containerRef} className="flex-1 overflow-y-auto py-6 px-4 no-scrollbar">
        <div
          style={{
            height: `${virtualizer.getTotalSize() + 100}px`, // Extra space for Add Files zone
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((vi) => {
            const pageRecord = displayPages[vi.index]
            if (!pageRecord || pageRecord.originalIndex === undefined) return null
            const pageNum = pageRecord.originalIndex
            const isCurrent = pageNum === currentPage
            const isSelected = selectedPageIndices.includes(vi.index)

            return (
              <div
                key={vi.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vi.start}px)`,
                  padding: "12px 0",
                }}
              >
                <div className="group relative flex flex-col items-center">
                  {/* Top Insertion Point */}
                  <div className="absolute -top-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={() => addBlankPage(vi.index - 1)}
                      className="size-6 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <div className="relative w-full max-w-[140px]">
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedPageIndices.length > 0) {
                          togglePageSelection?.(vi.index)
                        } else {
                          setPage(pageNum)
                        }
                      }}
                      className={cn(
                        "relative w-full cursor-pointer overflow-hidden rounded-[14px] border-2 bg-card transition-all duration-300 shadow-sm",
                        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                        "hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5",
                        isCurrent && !isSelected
                          ? "border-primary ring-4 ring-primary/5 shadow-primary/10"
                          : isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border/40"
                      )}
                    >
                      <div 
                        className="aspect-[3/4] w-full bg-white dark:bg-zinc-900/50 origin-center transition-transform duration-300" 
                        style={{ transform: `rotate(${pageRecord.rotation}deg)` }}
                      >
                        <ThumbnailCanvas
                          pdfDocument={pdfDocument}
                          pageNum={pageNum}
                          active={Math.abs(pageNum - currentPage) <= 8}
                        />
                      </div>

                      {/* Checkbox for selection */}
                      {(isSelected || selectedPageIndices.length > 0) && (
                        <div className="absolute top-2 left-2 z-10">
                          <div className={cn(
                            "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected ? "bg-primary border-primary text-white" : "bg-background/80 border-border"
                          )}>
                            {isSelected && <Check className="size-3 stroke-[3]" />}
                          </div>
                        </div>
                      )}

                      {/* Page Actions Overlay (Floating) */}
                      <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 z-10 px-2">
                        <TooltipProvider>
                           <div className="flex gap-1.5 bg-background/90 backdrop-blur-md p-1 rounded-full border border-border/40 shadow-2xl">
                             <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="size-7 rounded-full hover:bg-primary/10 hover:text-primary transition-all"
                                      onClick={(e) => { e.stopPropagation(); rotatePage(vi.index, 90); }}
                                   >
                                      <RotateCw className="size-3.5" />
                                   </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] font-bold">Rotate</TooltipContent>
                             </Tooltip>
                             
                             <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="size-7 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all"
                                      onClick={(e) => { e.stopPropagation(); deletePage(vi.index); }}
                                   >
                                      <Trash2 className="size-3.5" />
                                   </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] font-bold">Delete</TooltipContent>
                             </Tooltip>

                             <Tooltip>
                                <TooltipTrigger asChild>
                                   <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={cn(
                                        "size-7 rounded-full transition-all",
                                        isSelected ? "bg-primary text-white hover:bg-primary/90" : "hover:bg-primary/10 hover:text-primary"
                                      )}
                                      onClick={(e) => { e.stopPropagation(); togglePageSelection?.(vi.index); }}
                                   >
                                      <Check className="size-3.5" />
                                   </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] font-bold">Select</TooltipContent>
                             </Tooltip>
                           </div>
                        </TooltipProvider>
                      </div>
                    </button>
                    
                    {/* Centered Page Number */}
                    <div className="mt-3 text-center">
                       <span className={cn(
                          "text-[11px] font-bold transition-colors",
                          isCurrent ? "text-primary" : "text-muted-foreground/60"
                       )}>
                          {vi.index + 1}
                       </span>
                    </div>
                  </div>

                  {/* Bottom Insertion Point (for the last item) */}
                  {vi.index === displayPages.length - 1 && (
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={() => addBlankPage(vi.index)}
                        className="size-6 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Add Files Zone */}
          <div 
            style={{
              position: "absolute",
              top: `${virtualizer.getTotalSize()}px`,
              left: 0,
              width: "100%",
              padding: "20px 0 60px",
            }}
          >
            <button className="w-full flex flex-col items-center justify-center py-8 rounded-2xl border-2 border-dashed border-border/60 bg-background/40 hover:bg-background/60 hover:border-primary/40 transition-all group">
              <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileUp className="size-5" />
              </div>
              <span className="text-[11px] font-bold text-foreground/70">Add PDF, image...</span>
              <span className="text-[9px] font-medium text-muted-foreground mt-1">or drag & drop files here</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Batch Action Bar */}
      {selectedPageIndices.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/10 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-primary/30">
          <div className="flex items-center gap-2 px-2">
            <div className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
              {selectedPageIndices.length}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tight text-primary/80">Selected</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-primary/20 hover:text-primary transition-all"
              onClick={() => {
                selectedPageIndices.forEach(idx => rotatePage(idx, 90))
              }}
              title="Rotate Selected"
            >
              <RotateCw className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-all"
              onClick={() => {
                selectedPageIndices.forEach(idx => deletePage(idx))
                clearPageSelection()
              }}
              title="Delete Selected"
            >
              <Trash2 className="size-4" />
            </Button>
            <div className="mx-1 h-4 w-px bg-primary/20" />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-primary/20 transition-all"
              onClick={clearPageSelection}
              title="Clear Selection"
            >
              <Check className="size-4" />
            </Button>
          </div>
        </div>
      )}
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
