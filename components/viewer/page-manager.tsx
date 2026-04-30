"use client"

import { useEffect, useRef, useState } from "react"
import { Reorder, useDragControls, motion } from "framer-motion"
import { RotateCw, Trash2, Copy, Plus, X } from "lucide-react"
import type { PDFDocumentProxy } from "pdfjs-dist"

import { useViewer } from "@/features/viewer/provider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface PageManagerProps {
  pdfDocument: PDFDocumentProxy
}

export function PageManager({ pdfDocument }: PageManagerProps) {
  const pageOrder = useViewer((s) => s.pageOrder)
  const setPageOrder = useViewer((s) => s.setPageOrder)
  const reorderPage = useViewer((s) => s.reorderPage)
  const rotatePage = useViewer((s) => s.rotatePage)
  const deletePage = useViewer((s) => s.deletePage)
  const duplicatePage = useViewer((s) => s.duplicatePage)
  const addBlankPage = useViewer((s) => s.addBlankPage)
  const totalPages = useViewer((s) => s.totalPages)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)
  const documentId = useViewer((s) => s.documentId)
  const router = useRouter()

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
    const toastId = toast.loading("Applying changes...")
    try {
      const res = await fetch(`/api/documents/${documentId}/organize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageOrder),
      })

      if (!res.ok) throw new Error("Failed to organize document")

      toast.success("Document organized successfully", { id: toastId })
      // Full refresh to reload PDF and annotations
      window.location.reload()
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setIsApplying(false)
    }
  }

  const visiblePages = pageOrder.filter((p) => !p.deleted)

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-sm font-semibold">Organize Pages</h2>
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setSidebarTab("thumbnails")}>
           <X className="size-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <Reorder.Group
          axis="y"
          values={pageOrder}
          onReorder={setPageOrder}
          className="grid grid-cols-2 gap-4"
        >
          {pageOrder.map((page, index) => (
            !page.deleted && (
              <Reorder.Item
                key={`${page.originalIndex}-${index}`}
                value={page}
                className="relative group"
              >
                <div className={cn(
                  "relative aspect-[3/4] rounded-lg border-2 bg-card shadow-sm transition-all overflow-hidden",
                  "border-border hover:border-primary/50"
                )}>
                  <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 flex flex-col items-center justify-center gap-2">
                     <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-8 rounded-full shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            rotatePage(index, 90)
                          }}
                        >
                          <RotateCw className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="size-8 rounded-full shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            duplicatePage(index)
                          }}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="size-8 rounded-full shadow-md"
                          onClick={(e) => {
                            e.stopPropagation()
                            deletePage(index)
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                     </div>
                  </div>
                  
                  <div 
                    className="w-full h-full"
                    style={{ transform: `rotate(${page.rotation}deg)` }}
                  >
                    {page.type === "original" ? (
                      <PageThumbnail
                        pdfDocument={pdfDocument}
                        pageNum={page.originalIndex!}
                      />
                    ) : (
                      <div className="w-full h-full bg-white flex items-center justify-center border shadow-inner">
                         <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Blank Page</span>
                      </div>
                    )}
                  </div>

                  <div className="absolute bottom-2 left-2 z-20 size-6 rounded-md bg-background/80 backdrop-blur-sm border flex items-center justify-center text-[10px] font-bold">
                    {index + 1}
                  </div>
                </div>
              </Reorder.Item>
            )
          ))}
          
          <button
            type="button"
            onClick={() => addBlankPage(null)}
            className="aspect-[3/4] rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-accent/50 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground"
          >
            <Plus className="size-6" />
            <span className="text-xs font-medium">Add Page</span>
          </button>
        </Reorder.Group>
      </div>
      
      <div className="p-4 border-t bg-accent/5">
        <Button 
          className="w-full rounded-xl" 
          onClick={applyChanges}
          disabled={isApplying}
        >
          {isApplying ? "Applying..." : "Apply Changes"}
        </Button>
      </div>
    </div>
  )
}

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
