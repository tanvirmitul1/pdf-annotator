"use client"

import { useRef, useEffect } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import type { PDFDocumentProxy } from "pdfjs-dist"
import { Trash2, Plus, RotateCw, Check, FileUp } from "lucide-react"

import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

const THUMB_HEIGHT = 150


export function ThumbnailsPanel({
  pdfDocument,
  totalPages: _totalPages,
}: ThumbnailsPanelProps) {
  const currentPage = useViewer((s) => s.currentPage)
  const setPage = useViewer((s) => s.setPage)
  const pageOrder = useViewer((s) => s.pageOrder)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)
  const deletePage = useViewer((s) => s.deletePage)
  const addBlankPage = useViewer((s) => s.addBlankPage)
  const rotatePage = useViewer((s) => s.rotatePage)
  
  const selectedPageIndices = useViewer((s) => s.selectedPageIndices || [])
  const togglePageSelection = useViewer((s) => s.togglePageSelection)
  const clearPageSelection = useViewer((s) => s.clearPageSelection)

  const containerRef = useRef<HTMLDivElement>(null)

  const visiblePages = pageOrder.filter(p => !p.deleted)
  const displayPages = visiblePages

  const virtualizer = useVirtualizer({
    count: displayPages.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => THUMB_HEIGHT + 90, // Increased further to prevent overlapping

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
                       onClick={() => {
                         const idx = pageOrder.indexOf(displayPages[displayPages.length - 1])
                         addBlankPage(idx >= 0 ? idx : displayPages.length - 1)
                       }}
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
            if (!pageRecord) return null
            const actualIndex = pageOrder.indexOf(pageRecord)
            const pageNum = pageRecord.originalIndex ?? vi.index + 1
            const isCurrent = pageNum === currentPage
            const isSelected = selectedPageIndices.includes(actualIndex)

            return (
              <div
                key={vi.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${vi.start}px)`,
                  height: `${vi.size}px`,
                  padding: "16px 0",
                }}
              >
                <div className="group relative flex flex-col items-center">
                  {/* Top Insertion Point */}
                  <div className="absolute -top-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button 
                      onClick={() => addBlankPage(actualIndex - 1)}
                      className="size-6 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>


                  <div className="relative w-full max-w-[140px]">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (selectedPageIndices.length > 0) {
                          togglePageSelection?.(actualIndex)
                        } else {
                          setPage(pageNum)
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          if (selectedPageIndices.length > 0) {
                            togglePageSelection?.(actualIndex)
                          } else {
                            setPage(pageNum)
                          }
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
                        {pageRecord.type === "original" ? (
                          <ThumbnailCanvas
                            pdfDocument={pdfDocument}
                            pageNum={pageNum}
                            active={Math.abs(pageNum - currentPage) <= 8}
                          />
                        ) : (
                          <div className="flex h-full w-full flex-col items-center justify-center border-2 border-dashed border-border/20 bg-muted/5 shadow-inner">
                             <div className="size-10 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                                <Plus className="size-5 text-primary/40" />
                             </div>
                             <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Blank Page</span>
                          </div>
                        )}
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
                                      onClick={(e) => { e.stopPropagation(); rotatePage(actualIndex, 90); }}
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
                                      onClick={(e) => { e.stopPropagation(); deletePage(actualIndex); }}
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
                                      onClick={(e) => { e.stopPropagation(); togglePageSelection?.(actualIndex); }}
                                   >
                                      <Check className="size-3.5" />
                                   </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-[10px] font-bold">Select</TooltipContent>
                             </Tooltip>
                           </div>
                        </TooltipProvider>
                      </div>
                    </div>

                    
                    {/* Centered Page Number */}
                    <div className="mt-3 text-center">
                       <span className={cn(
                          "text-[11px] font-bold transition-colors",
                          isCurrent ? "text-primary" : "text-muted-foreground/60"
                       )}>
                          {actualIndex + 1}
                       </span>
                    </div>
                  </div>

                  {/* Bottom Insertion Point (for the last item) */}
                  {vi.index === displayPages.length - 1 && (
                    <div className="absolute -bottom-8 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button 
                        onClick={() => addBlankPage(actualIndex)}
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
      const scale = (THUMB_HEIGHT - 20) / viewport.height
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
    return <div className="w-full animate-pulse bg-muted" style={{ height: THUMB_HEIGHT - 20 }} />
  }

  return (
    <canvas
      ref={canvasRef}
      className="mx-auto block h-full object-contain shadow-sm"
      aria-hidden
    />
  )
}

