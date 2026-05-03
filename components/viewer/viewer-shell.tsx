"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist"
import { Loader2, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { PageManager } from "./page-manager"

import { ViewerProvider, useViewer } from "@/features/viewer/provider"
import {
  useGetDocumentViewerDataQuery,
  useUpdateReadingProgressMutation,
  useUpdatePageOrderMutation,
} from "@/features/viewer/api"
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation"
import { useListByDocumentQuery } from "@/features/annotations/api"
import { useAnnotationManager } from "@/features/annotations/use-annotation-manager"
import { cn } from "@/lib/utils"
import { useGetMeQuery } from "@/features/auth/slice"
import { useShortcuts } from "@/hooks/use-shortcuts"
import { useAnnotationShortcuts } from "@/hooks/use-annotation-shortcuts"
import { Toolbar } from "./toolbar"
import type { SessionUser } from "@/features/auth/slice"
import { Sidebar } from "./sidebar"
import { PdfViewer } from "./pdf-viewer"
import { SearchBar } from "./search-bar"
import { ShortcutsOverlay } from "./shortcuts-overlay"
import { OfflineBanner } from "./offline-banner"
import { ViewerSkeleton } from "./viewer-skeleton"
import { AnnotationToolbar } from "@/components/annotations/annotation-toolbar"
import { SecondaryToolbar } from "@/components/annotations/secondary-toolbar"
import { BottomBar } from "@/components/annotations/bottom-bar"
import { AnnotationSidebar } from "@/components/annotations/annotation-sidebar"
import { SaveStatus } from "@/components/annotations/save-status"
import { LoginGateModal } from "./login-gate-modal"
import { SHORTCUTS } from "@/features/shortcuts/definitions"
import type { PageMetadata } from "@/features/viewer/store"

type PdfjsModule = typeof import("pdfjs-dist")

let pdfjsModulePromise: Promise<PdfjsModule> | null = null

async function getPdfjsModule(): Promise<PdfjsModule> {
  if (!pdfjsModulePromise) {
    // @ts-expect-error — URL path import, not resolvable by TS; types come from PdfjsModule cast below
    pdfjsModulePromise = import(/* webpackIgnore: true */ "/pdf.min.mjs").then(
      (mod) => {
        const pdfjs = mod as unknown as PdfjsModule
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
        return pdfjs
      }
    )
  }
  return pdfjsModulePromise
}

export interface ViewerShellProps {
  documentId: string
  documentName: string
  initialPage?: number
  isAuthenticated?: boolean
  user?: SessionUser | null
}

export function ViewerShell({
  documentId,
  documentName,
  initialPage = 1,
  isAuthenticated = false,
  user: serverUser,
}: ViewerShellProps) {
  const [showLoginGate, setShowLoginGate] = useState(false)
  const [verifiedAuth, setVerifiedAuth] = useState(isAuthenticated)

  // Verify authentication on client-side
  const { data: authData } = useGetMeQuery(undefined, {
    skip: isAuthenticated, // Skip if already authenticated from server
    pollingInterval: 30000, // Check every 30 seconds
  })

  // Update verified auth status based on API response
  useEffect(() => {
    if (authData) {
      setVerifiedAuth(authData.authenticated)
    }
  }, [authData])

  // Use the verified auth status (server-side or client-side verified)
  const effectiveAuth = isAuthenticated || verifiedAuth

  // Prefer server-provided user; fall back to client query if needed
  const user = serverUser ?? authData?.user ?? null

  const handleAnnotationAttempt = useCallback(() => {
    if (!effectiveAuth) {
      setShowLoginGate(true)
      return false
    }
    return true
  }, [effectiveAuth])

  return (
    <>
      <ViewerProvider
        documentId={documentId}
        isAuthenticated={effectiveAuth}
        onAnnotationAttempt={handleAnnotationAttempt}
      >
        <ViewerShellInner
          documentId={documentId}
          documentName={documentName}
          initialPage={initialPage}
          isAuthenticated={effectiveAuth}
          user={user}
        />
      </ViewerProvider>
      <LoginGateModal
        open={showLoginGate}
        onOpenChange={setShowLoginGate}
        documentId={documentId}
      />
    </>
  )
}


export function ViewerShellInner({
  documentId,
  documentName,
  initialPage,
  user,
}: ViewerShellProps) {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const sidebarOpen = useViewer((s) => s.sidebarOpen)
  const sidebarTab = useViewer((s) => s.sidebarTab)
  const currentPage = useViewer((s) => s.currentPage)
  const totalPages = useViewer((s) => s.totalPages)
  const zoom = useViewer((s) => s.zoom)
  const setZoom = useViewer((s) => s.setZoom)
  const setPage = useViewer((s) => s.setPage)
  const setTotalPages = useViewer((s) => s.setTotalPages)
  const openSidebar = useViewer((s) => s.openSidebar)
  const openSearch = useViewer((s) => s.openSearch)
  const closeSearch = useViewer((s) => s.closeSearch)
  const searchOpen = useViewer((s) => s.searchOpen)
  const openShortcuts = useViewer((s) => s.openShortcuts)
  const closeShortcuts = useViewer((s) => s.closeShortcuts)
  const shortcutsOpen = useViewer((s) => s.shortcutsOpen)
  const rightPanelAnnotationId = useViewer((s) => s.rightPanelAnnotationId)
  const closeAnnotation = useViewer((s) => s.closeAnnotation)
  const closeSidebar = useViewer((s) => s.closeSidebar)
  const toggleSidebar = useViewer((s) => s.toggleSidebar)
  const draft = useViewer((s) => s.draft)
  const undo = useViewer((s) => s.undo)
  const redo = useViewer((s) => s.redo)
  const clearUndoHistory = useViewer((s) => s.clearUndoHistory)
  const setSaveStatus = useViewer((s) => s.setSaveStatus)

  const [pollingInterval, setPollingInterval] = useState(0)
  const { data, isLoading, refetch } = useGetDocumentViewerDataQuery(documentId, {
    pollingInterval,
  })

  useEffect(() => {
    setPollingInterval(data?.document?.status === "PROCESSING" ? 10000 : 0)
  }, [data?.document?.status])
  const setPageOrder = useViewer((s) => s.setPageOrder)
  const pageOrder = useViewer((s) => s.pageOrder)

  const [updateProgress] = useUpdateReadingProgressMutation()
  const [updatePageOrder] = useUpdatePageOrderMutation()

  const { call: debouncedUpdatePageOrder } = useDebouncedMutation(
    (order: PageMetadata[]) => updatePageOrder({ documentId, pageOrder: order }),
    1000
  )

  // Sync pageOrder to store on load
  useEffect(() => {
    if (data?.pageOrder) {
      setPageOrder(data.pageOrder)
    }
  }, [data?.pageOrder, setPageOrder])

  // Watch for pageOrder changes and persist
  const lastPersistedOrderRef = useRef<string>("")
  useEffect(() => {
    const orderStr = JSON.stringify(pageOrder)
    if (pageOrder.length > 0 && orderStr !== lastPersistedOrderRef.current) {
       // Only persist if it's not the initial load from server
       if (lastPersistedOrderRef.current !== "") {
         debouncedUpdatePageOrder(pageOrder)
       }
       lastPersistedOrderRef.current = orderStr
    }
  }, [pageOrder, debouncedUpdatePageOrder])
  const { updateAnnotation, deleteAnnotation, restoreAnnotation } = useAnnotationManager(documentId)

  // Multi-user polling: poll every 10s when collaborators exist and user isn't drawing
  const hasCollaborators = (data?.collaborators?.length ?? 0) > 1
  const shouldPoll = hasCollaborators && !draft
  useListByDocumentQuery(documentId, {
    pollingInterval: shouldPoll ? 10_000 : 0,
    skipPollingIfUnfocused: true,
  })

  // Undo handler
  const handleUndo = useCallback(async () => {
    const entry = undo()
    if (!entry) return

    try {
      setSaveStatus("saving")
      if (entry.action === "create" && entry.after) {
        deleteAnnotation({ id: entry.after.id, documentId })
      } else if (entry.action === "delete" && entry.before) {
        restoreAnnotation({ id: entry.before.id, documentId })
      } else if (entry.action === "update" && entry.before) {
        const { content, color, positionData } = entry.before
        updateAnnotation({
          id: entry.before.id,
          documentId,
          content: content ?? undefined,
          color,
          positionData,
        })
      }
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }, [undo, deleteAnnotation, restoreAnnotation, updateAnnotation, documentId, setSaveStatus])

  // Redo handler
  const handleRedo = useCallback(async () => {
    const entry = redo()
    if (!entry) return

    try {
      setSaveStatus("saving")
      if (entry.action === "create" && entry.after) {
        restoreAnnotation({ id: entry.after.id, documentId })
      } else if (entry.action === "delete" && entry.before) {
        deleteAnnotation({ id: entry.before.id, documentId })
      } else if (entry.action === "update" && entry.after) {
        const { content, color, positionData } = entry.after
        updateAnnotation({
          id: entry.after.id,
          documentId,
          content: content ?? undefined,
          color,
          positionData,
        })
      }
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }, [redo, deleteAnnotation, restoreAnnotation, updateAnnotation, documentId, setSaveStatus])
  const handleDeleteSelected = useCallback(async () => {
    if (!rightPanelAnnotationId) return
    try {
      setSaveStatus("saving")
      deleteAnnotation({ id: rightPanelAnnotationId, documentId })
      closeAnnotation()
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }, [rightPanelAnnotationId, deleteAnnotation, documentId, closeAnnotation, setSaveStatus])

  // Register annotation shortcuts
  useAnnotationShortcuts(handleDeleteSelected, handleUndo, handleRedo)

  // Debounced progress update
  const progressTimer = useRef<NodeJS.Timeout | null>(null)
  const handleProgressUpdate = useCallback(
    (page: number, percent: number) => {
      if (progressTimer.current) clearTimeout(progressTimer.current)
      progressTimer.current = setTimeout(() => {
        void updateProgress({
          documentId,
          lastPage: page,
          percentComplete: percent,
        })
      }, 1000)
    },
    [documentId, updateProgress]
  )

  // Flush pending reading-progress on page unload via sendBeacon
  useEffect(() => {
    function onUnload() {
      if (progressTimer.current) {
        clearTimeout(progressTimer.current)
        progressTimer.current = null
      }

      if (totalPages > 0 && currentPage > 0) {
        const percent = Math.round(
          ((currentPage - 1) / Math.max(totalPages - 1, 1)) * 100
        )
        navigator.sendBeacon(
          `/api/documents/${documentId}/reading-progress`,
          new Blob(
            [JSON.stringify({ lastPage: currentPage, percentComplete: percent })],
            { type: "application/json" }
          )
        )
      }
    }
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [documentId, currentPage, totalPages])

  // Clear undo history on document change
  useEffect(() => {
    clearUndoHistory()
  }, [documentId, clearUndoHistory])

  const initialLastPage = useRef<number | null>(null)
  if (initialLastPage.current === null && data?.readingProgress?.lastPage) {
    initialLastPage.current = data.readingProgress.lastPage
  }

  const docStatus = data?.document?.status
  const docStorageKey = data?.document?.storageKey
  useEffect(() => {
    if (!data?.document) return
    if (docStatus === "FAILED") return

    if (!docStorageKey) return

    let cancelled = false

    async function loadPdf() {
      try {
        const { getDocument } = await getPdfjsModule()
        const res = await fetch(
          `/api/documents/${documentId}/download?flavor=original`
        )
        if (!res.ok) throw new Error("Download URL unavailable")
        const { url } = await res.json()

        const loadingTask: PDFDocumentLoadingTask = getDocument({
          url,
          standardFontDataUrl: "/standard_fonts/",
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        })
        const pdf = await loadingTask.promise
        if (!cancelled) {
          setPdfDocument(pdf)
          setTotalPages(pdf.numPages)
          const lastPage = initialLastPage.current
          if (lastPage && lastPage > 1) {
            setPage(lastPage)
          } else if (initialPage && initialPage > 1) {
            setPage(initialPage)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError((err as Error).message ?? "Failed to load PDF")
        }
      }
    }

    loadPdf()
    return () => {
      cancelled = true
    }
  }, [docStatus, docStorageKey, documentId, initialPage, setPage, setTotalPages, refetch, data?.document])

  const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  useShortcuts([
    {
      ...SHORTCUTS.PREV_PAGE,
      handler: () => setPage(currentPage - 1),
    },
    {
      ...SHORTCUTS.NEXT_PAGE,
      handler: () => setPage(currentPage + 1),
    },
    {
      ...SHORTCUTS.ZOOM_IN,
      handler: () => {
        const next = ZOOM_STEPS.find((z) => z > zoom)
        if (next) setZoom(next)
      },
    },
    {
      ...SHORTCUTS.ZOOM_OUT,
      handler: () => {
        const next = [...ZOOM_STEPS].reverse().find((z) => z < zoom)
        if (next) setZoom(next)
      },
    },
    {
      ...SHORTCUTS.ZOOM_FIT,
      handler: () => setZoom(1),
    },
    {
      ...SHORTCUTS.TOGGLE_THUMBNAILS,
      handler: () => openSidebar("thumbnails"),
    },
    {
      ...SHORTCUTS.TOGGLE_OUTLINE,
      handler: () => openSidebar("outline"),
    },
    {
      ...SHORTCUTS.OPEN_SEARCH,
      handler: () => openSearch(),
    },
    {
      ...SHORTCUTS.ESCAPE,
      handler: () => {
        if (searchOpen) closeSearch()
        else if (shortcutsOpen) closeShortcuts()
      },
    },
    {
      ...SHORTCUTS.SHOW_SHORTCUTS,
      handler: () => openShortcuts(),
    },
  ])



  if (isLoading || !pdfDocument) {
    const status = data?.document?.status
    return (
      <div className="flex h-full flex-col overflow-hidden bg-background">
        {loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <span className="text-xl font-bold">!</span>
            </div>
            <div className="space-y-1 text-center">
              <p className="font-semibold text-foreground">Failed to load</p>
              <p className="text-sm text-muted-foreground">{loadError}</p>
            </div>
            <button
              className="rounded-full border border-border/70 px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        ) : status !== "READY" ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex max-w-xs flex-col items-center gap-6 text-center">
              <div className="relative flex size-20 items-center justify-center">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/10 border-t-primary" />
                <Loader2 className="size-8 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-heading text-lg font-bold text-foreground">
                  Preparing Your Workspace
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We&apos;re processing your PDF for high-fidelity rendering and search.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <ViewerSkeleton />
        )}
      </div>
    )
  }

  const outline = data?.outline ?? null

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background selection:bg-primary/20">
      <OfflineBanner />

      {/* Top Bar Area: Docked Header + Secondary Tool Header */}
      <div className="shrink-0 flex flex-col border-b border-border/40 bg-card/50 backdrop-blur-md z-50">
        <Toolbar
          documentId={documentId}
          documentName={documentName}
          downloadUrl={null}
          saveStatusSlot={<SaveStatus className="ml-2" />}
          collaborators={data?.collaborators ?? []}
          canInviteMembers={Boolean(data?.permissions.canInviteMembers)}
          canManageMembers={Boolean(data?.permissions.canManageMembers)}
          user={user}
        />
        
        {/* Horizontal Tool Header (Integrated) */}
        <div className="flex h-auto min-h-12 w-full items-center justify-center border-t border-border/20 px-2 py-2 md:px-4 flex-wrap">
           <div className="flex-shrink-0 z-50">
             <AnnotationToolbar />
           </div>
        </div>
      </div>

      <main className="relative flex flex-1 overflow-hidden min-h-0">
        {/* Left Sidebar: Integrated into layout flow on desktop */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="z-40 h-full border-r border-border/40 bg-card/30 backdrop-blur-2xl flex-shrink-0 overflow-hidden hidden md:block"
            >
              <Sidebar
                documentId={documentId}
                pdfDocument={pdfDocument}
                totalPages={totalPages}
                outline={outline}
                className="w-72"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Sidebar: Overlay/Drawer */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-[60] w-[280px] border-r border-border/40 bg-card backdrop-blur-3xl md:hidden"
            >
               <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                     <span className="font-semibold">Document Info</span>
                     <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                        <X className="size-4" />
                     </Button>
                  </div>
                  <Sidebar
                    documentId={documentId}
                    pdfDocument={pdfDocument}
                    totalPages={totalPages}
                    outline={outline}
                    className="w-full flex-1"
                  />
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center Canvas Area: Properly constrained and scrollable */}
        <div className="relative flex-1 flex flex-col min-w-0 bg-muted/10 h-full">
          {/* Floating Context Toolbar (Top Center) - More subtle now that tools are at the top */}
          <div className="pointer-events-none absolute left-0 right-0 top-4 z-40 flex justify-center">
            <div className="pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
              <SecondaryToolbar />
            </div>
          </div>

          {/* PDF Viewer: Takes up remaining space and is scrollable */}
          <div className="flex-1 min-h-0 h-full">
            <PdfViewer
              pdfDocument={pdfDocument}
              documentId={documentId}
              pagesData={data?.pagesData}
              onProgressUpdate={handleProgressUpdate}
            />
          </div>

          {/* Bottom Controls: Navigation/Zoom consolidated here on mobile */}
          <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-40 flex justify-center px-4">
            <div className="pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <BottomBar />
            </div>
          </div>
        </div>

        {/* Right Annotation Sidebar */}
        <div
          className={cn(
            "z-[55] h-full border-l border-border/40 bg-card/10 backdrop-blur-3xl shadow-sm flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out",
            "fixed inset-y-0 right-0 w-[20rem] translate-x-[100%] md:translate-x-0 md:relative",
            rightPanelAnnotationId && "translate-x-0"
          )}
        >
          <div className="absolute top-2 right-4 z-50 md:hidden">
            <Button variant="outline" size="icon" className="rounded-full h-8 w-8" onClick={() => closeAnnotation()}>
               <X className="size-4" />
            </Button>
          </div>
          <AnnotationSidebar documentId={documentId} />
        </div>
      </main>

      {/* Overlays */}
      <SearchBar documentId={documentId} />
      <ShortcutsOverlay />
      
      {/* Page Organize Mode (Full Screen Overlay if active) */}
      {sidebarTab === "organize" && sidebarOpen && (
         <div className="fixed inset-0 z-[100] bg-background/98 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
            <div className="container mx-auto h-full py-8 flex flex-col">
               <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Organize Pages</h2>
                  <Button variant="ghost" size="icon" onClick={() => closeSidebar()}>
                     <X className="size-5" />
                  </Button>
               </div>
               <div className="flex-1 min-h-0">
                  <PageManager pdfDocument={pdfDocument} />
               </div>
            </div>
         </div>
      )}
    </div>
  )
}


