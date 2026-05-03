"use client"

import { useEffect, useRef, useState } from "react"
import { Reorder } from "framer-motion"

import { RotateCw, Trash2, Copy, Plus } from "lucide-react"
import type { PDFDocumentProxy } from "pdfjs-dist"

import { useViewer } from "@/features/viewer/provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface PageManagerProps {
  pdfDocument: PDFDocumentProxy
}

export function PageManager({ pdfDocument }: PageManagerProps) {
  const pageOrder = useViewer((s) => s.pageOrder)
  const setPageOrder = useViewer((s) => s.setPageOrder)
  const rotatePage = useViewer((s) => s.rotatePage)
  const deletePage = useViewer((s) => s.deletePage)
  const duplicatePage = useViewer((s) => s.duplicatePage)
  const addBlankPage = useViewer((s) => s.addBlankPage)
  const totalPages = useViewer((s) => s.totalPages)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)
  const documentId = useViewer((s) => s.documentId)

  const [isApplying, setIsApplying] = useState(false)

  // Initialize pageOrder if empty
  useEffect(() => {
    if (pageOrder.length === 0 && totalPages > 0) {
      const initialOrder = Array.from({ length: totalPages }, (_, i) => ({
        originalIndex: i + 1,
        type: "original" as const,
        rotation: 0 as const,
      }))
      setPageOrder(initialOrder)
    }
  }, [totalPages, pageOrder.length, setPageOrder])

  const applyChanges = async () => {
    setIsApplying(true)
    const toastId = toast.loading("Applying changes and re-processing PDF...")
    try {
      const res = await fetch(`/api/documents/${documentId}/organize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageOrder),
      })

      if (!res.ok) throw new Error("Failed to organize document")

      toast.success("Document organized successfully. Reloading...", { id: toastId })
      // Full refresh to reload PDF and annotations
      window.location.reload()
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setIsApplying(false)
    }
  }


  return (
    <div className="flex h-full flex-col bg-background/50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/40">
        <div className="space-y-1">
          <h2 className="text-2xl font-heading font-bold tracking-tight">Organize Document</h2>
          <p className="text-sm text-muted-foreground">Drag to reorder, rotate, or delete pages.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button variant="outline" className="rounded-full px-6" onClick={() => setSidebarTab("thumbnails")}>
             Cancel
           </Button>
           <Button 
            className="rounded-full px-8 shadow-lg shadow-primary/20" 
            onClick={applyChanges}
            disabled={isApplying}
          >
            {isApplying ? <><Loader2 className="mr-2 size-4 animate-spin" /> Applying...</> : "Save Changes"}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <Reorder.Group
          axis="x"
          values={pageOrder}
          onReorder={setPageOrder}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8"
        >
          {pageOrder.map((page, index) => (
            !page.deleted && (
              <Reorder.Item
                key={`${page.originalIndex}-${index}`}
                value={page}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group relative cursor-grab active:cursor-grabbing"
              >
                <div className={cn(
                  "relative aspect-[3/4] rounded-2xl border-2 bg-card shadow-md transition-all duration-300 overflow-hidden",
                  "border-border/40 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10"
                )}>
                  {/* Actions Overlay */}
                  <div className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
                      <div className="flex gap-2">
                        <Tip label="Rotate 90°">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="size-10 rounded-full shadow-xl hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              rotatePage(index, 90)
                            }}
                          >
                            <RotateCw className="size-5" />
                          </Button>
                        </Tip>
                        <Tip label="Duplicate">
                          <Button
                            size="icon"
                            variant="secondary"
                            className="size-10 rounded-full shadow-xl hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              duplicatePage(index)
                            }}
                          >
                            <Copy className="size-5" />
                          </Button>
                        </Tip>
                        <Tip label="Delete Page">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="size-10 rounded-full shadow-xl hover:scale-110 transition-transform"
                            onClick={(e) => {
                              e.stopPropagation()
                              deletePage(index)
                            }}
                          >
                            <Trash2 className="size-5" />
                          </Button>
                        </Tip>
                      </div>
                  </div>
                  
                  {/* Page Preview */}
                  <div 
                    className="w-full h-full bg-card transition-transform duration-500 ease-out pointer-events-none"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  >
                    {page.type === "original" ? (
                      <PageThumbnail
                        pdfDocument={pdfDocument}
                        pageNum={page.originalIndex!}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border/20 bg-muted/5 shadow-inner">
                         <div className="size-12 rounded-full bg-primary/5 flex items-center justify-center mb-2">
                            <Plus className="size-6 text-primary/40" />
                         </div>
                         <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest opacity-60">Blank Page</span>
                      </div>
                    )}
                  </div>

                  {/* Index Badge */}
                  <div className="absolute bottom-4 left-4 z-40 size-8 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 shadow-sm flex items-center justify-center text-xs font-bold text-foreground ring-1 ring-border/40">
                    {index + 1}
                  </div>
                </div>
              </Reorder.Item>
            )
          ))}
          
          <button
            type="button"
            onClick={() => addBlankPage(null)}
            className="aspect-[3/4] rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 text-muted-foreground group h-full"
          >
            <div className="size-12 rounded-full border-2 border-dashed border-border/60 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/10 transition-all">
              <Plus className="size-6 transition-transform group-hover:scale-110" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Add Blank Page</span>
          </button>
        </Reorder.Group>
      </div>

    </div>
  )
}

function Tip({ children, label }: { children: React.ReactNode, label: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent className="text-xs font-medium">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

import { Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

function PageThumbnail({ pdfDocument, pageNum }: { pdfDocument: PDFDocumentProxy, pageNum: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    async function render() {
      const page = await pdfDocument.getPage(pageNum)
      if (cancelled || !canvasRef.current) return

      const viewport = page.getViewport({ scale: 1 })
      const scale = 160 / viewport.width
      const scaledVp = page.getViewport({ scale })

      const canvas = canvasRef.current
      canvas.width = scaledVp.width
      canvas.height = scaledVp.height
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      await page.render({
        canvasContext: ctx,
        viewport: scaledVp,
        canvas: canvasRef.current,
      }).promise
    }
    render()
    return () => { cancelled = true }
  }, [pdfDocument, pageNum])

  return <canvas ref={canvasRef} className="w-full h-full object-contain" />
}
