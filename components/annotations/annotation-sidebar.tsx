"use client"

import { useMemo, useRef } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Filter } from "lucide-react"

import { useListByDocumentQuery } from "@/features/annotations/api"
import { useGetDocumentViewerDataQuery } from "@/features/viewer/api"
import { useViewer } from "@/features/viewer/provider"
import { AnnotationCard } from "./annotation-card"
import { buildAnnotationListRows } from "@/features/annotations/list-utils"

interface AnnotationSidebarProps {
  documentId: string
}

export function AnnotationSidebar({ documentId }: AnnotationSidebarProps) {
  const { data: annotations = [], isLoading } = useListByDocumentQuery(documentId)
  const { data: viewerData } = useGetDocumentViewerDataQuery(documentId)
  
  const selectedAnnotationId = useViewer((state) => state.rightPanelAnnotationId)

  // Use the buildAnnotationListRows to group annotations by page
  const rows = useMemo(() => buildAnnotationListRows(annotations), [annotations])
  
  const collaborators = useMemo(
    () => viewerData?.collaborators ?? [],
    [viewerData]
  )

  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      const row = rows[index]
      if (!row) return 0
      if (row.kind === "header") return 30
      // If expanded, estimate a larger size. The measureElement will fix it accurately.
      if (row.annotation.id === selectedAnnotationId) return 600 
      return 140
    },
    overscan: 4,
  })

  // Scroll to the selected annotation automatically when it changes
  // We use a small timeout to let the measureElement update the size
  const previousSelectedRef = useRef<string | null>(null)
  if (selectedAnnotationId !== previousSelectedRef.current) {
    if (selectedAnnotationId) {
      const index = rows.findIndex(r => r.kind === "annotation" && r.annotation.id === selectedAnnotationId)
      if (index !== -1) {
        setTimeout(() => {
          virtualizer.scrollToIndex(index, { align: "start" })
        }, 50)
      }
    }
    previousSelectedRef.current = selectedAnnotationId
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card/30 backdrop-blur-2xl">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (annotations.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-4 text-center bg-card/30 backdrop-blur-2xl">
        <Filter className="size-8 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          No annotations yet.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col bg-card/30 backdrop-blur-2xl">
      <div className="flex h-11 shrink-0 items-center border-b border-border/40 px-4 bg-muted/20">
         <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
           Comments
         </span>
      </div>
      <div ref={parentRef} className="flex-1 overflow-y-auto px-2 py-2 min-h-0">
        <div
          className="relative w-full"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            if (!row) return null

            if (row.kind === "header") {
              return (
                <div
                  key={row.id}
                  className="absolute left-0 top-0 w-full py-1"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Page {row.pageNumber}
                  </p>
                </div>
              )
            }

            const annotation = row.annotation
            const isSelected = annotation.id === selectedAnnotationId

            return (
              <div
                key={row.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full pb-3"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                <AnnotationCard
                  documentId={documentId}
                  annotation={annotation}
                  collaborators={collaborators}
                  isExpanded={isSelected}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
