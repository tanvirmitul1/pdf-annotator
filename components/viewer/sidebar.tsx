"use client"

import type { PDFDocumentProxy } from "pdfjs-dist"
import { cn } from "@/lib/utils"
import { useViewer } from "@/features/viewer/provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { motion, AnimatePresence } from "framer-motion"
import { ThumbnailsPanel } from "./thumbnails-panel"
import { OutlinePanel } from "./outline-panel"
import { BookmarksPanel } from "./bookmarks-panel"
import { AnnotationList } from "@/components/annotations/annotation-list"
import { PageManager } from "./page-manager"
import type { DocumentOutlineEntry } from "@/features/viewer/api"
import type { SidebarTab } from "@/features/viewer/store"

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
        "flex h-full flex-col bg-card/10 backdrop-blur-3xl",
        className
      )}
      aria-label="Document sidebar"
    >
      <Tabs
        value={currentTab}
        onValueChange={(v) => setSidebarTab(v as SidebarTab)}
        className="flex h-full flex-col"
      >
        <div className="px-3 pt-4 pb-2">
           <TabsList className="grid h-10 w-full grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1">
             <TabsTrigger
               value="thumbnails"
               className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
               title="Thumbnails (T)"
             >
               Pages
             </TabsTrigger>
             <TabsTrigger
               value="outline"
               className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
               title="Outline (O)"
             >
               List
             </TabsTrigger>
             <TabsTrigger
               value="bookmarks"
               className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
             >
               Marks
             </TabsTrigger>
             <TabsTrigger
               value="annotations"
               className="rounded-lg py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm"
             >
               Notes
             </TabsTrigger>
           </TabsList>
        </div>

        <Separator className="opacity-20" />

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
             <motion.div
                key={currentTab}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
             >
               <TabsContent value="thumbnails" className="m-0 h-full">
                 <ThumbnailsPanel
                   pdfDocument={pdfDocument}
                   totalPages={totalPages}
                 />
               </TabsContent>

               <TabsContent value="outline" className="m-0 h-full">
                 <OutlinePanel outline={outline} />
               </TabsContent>

               <TabsContent value="bookmarks" className="m-0 h-full">
                 <BookmarksPanel documentId={documentId} />
               </TabsContent>

               <TabsContent value="annotations" className="m-0 h-full">
                 <AnnotationList documentId={documentId} />
               </TabsContent>

               <TabsContent value="organize" className="m-0 h-full">
                 <PageManager pdfDocument={pdfDocument} />
               </TabsContent>
             </motion.div>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  )
}

