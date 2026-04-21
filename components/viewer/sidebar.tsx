"use client"

import type { PDFDocumentProxy } from "pdfjs-dist"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useViewer } from "@/features/viewer/provider"
import { ThumbnailsPanel } from "./thumbnails-panel"
import { OutlinePanel } from "./outline-panel"
import { BookmarksPanel } from "./bookmarks-panel"
import type { DocumentOutlineEntry } from "@/features/viewer/api"
import { cn } from "@/lib/utils"

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

  return (
    <div
      className={cn(
        "flex w-56 shrink-0 flex-col border-r border-border bg-card",
        className
      )}
    >
      <Tabs
        value={sidebarTab ?? "thumbnails"}
        onValueChange={(v) =>
          setSidebarTab(v as "thumbnails" | "outline" | "bookmarks")
        }
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="h-auto w-full rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger
            value="thumbnails"
            className="flex-1 rounded-none border-b-2 border-transparent py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Pages
          </TabsTrigger>
          <TabsTrigger
            value="outline"
            className="flex-1 rounded-none border-b-2 border-transparent py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Outline
          </TabsTrigger>
          <TabsTrigger
            value="bookmarks"
            className="flex-1 rounded-none border-b-2 border-transparent py-2 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            Bookmarks
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="thumbnails"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <ThumbnailsPanel pdfDocument={pdfDocument} totalPages={totalPages} />
        </TabsContent>

        <TabsContent
          value="outline"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <OutlinePanel outline={outline} />
        </TabsContent>

        <TabsContent
          value="bookmarks"
          className="mt-0 flex flex-1 flex-col overflow-hidden"
        >
          <BookmarksPanel documentId={documentId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
