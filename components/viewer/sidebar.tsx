"use client"

import type { PDFDocumentProxy } from "pdfjs-dist"
import { cn } from "@/lib/utils"
import { useViewer } from "@/features/viewer/provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThumbnailsPanel } from "./thumbnails-panel"
import { OutlinePanel } from "./outline-panel"
import { BookmarksPanel } from "./bookmarks-panel"
import { AnnotationList } from "@/components/annotations/annotation-list"
import type { DocumentOutlineEntry } from "@/features/viewer/api"

interface SidebarProps {
  documentId: string
  pdfDocument: PDFDocumentProxy
  totalPages: number
  outline: DocumentOutlineEntry[] | null
  className?: string
}

export function Sidebar({
  documentId,
  pdfDocument,
  totalPages,
  outline,
  className,
}: SidebarProps) {
  const sidebarTab = useViewer((s) => s.sidebarTab)
  const setSidebarTab = useViewer((s) => s.setSidebarTab)

  const currentTab = sidebarTab ?? "thumbnails"

  return (
    <div
      className={cn(
        "flex w-52 shrink-0 flex-col border-r border-border/60 bg-card/75 backdrop-blur-xl",
        className
      )}
      aria-label="Document sidebar"
    >
      <Tabs
        value={currentTab}
        onValueChange={(v) =>
          setSidebarTab(v as "thumbnails" | "outline" | "bookmarks" | "annotations")
        }
        className="flex h-full flex-col"
      >
        <TabsList className="mx-2 mt-2 grid h-auto grid-cols-4 gap-0.5 rounded-lg bg-muted/80 p-0.5">
          <TabsTrigger
            value="thumbnails"
            className="rounded-md py-1 text-[10px] font-medium"
            title="Thumbnails (T)"
          >
            Pages
          </TabsTrigger>
          <TabsTrigger
            value="outline"
            className="rounded-md py-1 text-[10px] font-medium"
            title="Outline (O)"
          >
            Outline
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="rounded-md py-1 text-[10px] font-medium"
          >
            Marks
          </TabsTrigger>
          <TabsTrigger
            value="annotations"
            className="rounded-md py-1 text-[10px] font-medium"
          >
            Notes
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="thumbnails" className="mt-0 h-full">
            <ThumbnailsPanel
              pdfDocument={pdfDocument}
              totalPages={totalPages}
            />
          </TabsContent>

          <TabsContent value="outline" className="mt-0 h-full">
            <OutlinePanel outline={outline} />
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-0 h-full">
            <BookmarksPanel documentId={documentId} />
          </TabsContent>

          <TabsContent value="annotations" className="mt-0 h-full">
            <AnnotationList documentId={documentId} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
