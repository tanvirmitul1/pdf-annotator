"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist"
import { Loader2 } from "lucide-react"

import { ViewerProvider, useViewer } from "@/features/viewer/provider"
import {
  useGetDocumentViewerDataQuery,
  useUpdateReadingProgressMutation,
} from "@/features/viewer/api"
import {
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useUpdateAnnotationMutation,
  useListByDocumentQuery,
} from "@/features/annotations/api"
import { useGetMeQuery } from "@/features/auth/slice"
import { useShortcuts } from "@/hooks/use-shortcuts"
import { useAnnotationShortcuts } from "@/hooks/use-annotation-shortcuts"
import { Toolbar } from "./toolbar"
import { Sidebar } from "./sidebar"
import { PdfViewer } from "./pdf-viewer"
import { SearchBar } from "./search-bar"
import { ShortcutsOverlay } from "./shortcuts-overlay"
import { OfflineBanner } from "./offline-banner"
import { ViewerSkeleton } from "./viewer-skeleton"
import { AnnotationToolbar } from "@/components/annotations/annotation-toolbar"
import { AnnotationPanel } from "@/components/annotations/annotation-panel"
import { SaveStatus } from "@/components/annotations/save-status"
import { LoginGateModal } from "./login-gate-modal"
import type { AnnotationWithTags } from "@/features/annotations/types"

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
}

export function ViewerShell({
  documentId,
  documentName,
  initialPage = 1,
  isAuthenticated = false,
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

function toCreateAnnotationInput(
  annotation: AnnotationWithTags,
  documentId: string
) {
  return {
    documentId,
    pageNumber: annotation.pageNumber,
    type: annotation.type,
    color: annotation.color,
    positionData: annotation.positionData,
    ...(annotation.content ? { content: annotation.content } : {}),
  }
}

function ViewerShellInner({
  documentId,
  documentName,
  initialPage,
}: ViewerShellProps) {
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const sidebarOpen = useViewer((s) => s.sidebarOpen)
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
  const undo = useViewer((s) => s.undo)
  const redo = useViewer((s) => s.redo)
  const clearUndoHistory = useViewer((s) => s.clearUndoHistory)
  const setSaveStatus = useViewer((s) => s.setSaveStatus)

  const { data, isLoading, refetch } = useGetDocumentViewerDataQuery(documentId)
  const [updateProgress] = useUpdateReadingProgressMutation()
  const [createAnnotation] = useCreateAnnotationMutation()
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const [updateAnnotation] = useUpdateAnnotationMutation()
  const { data: annotations = [] } = useListByDocumentQuery(documentId)

  // Undo handler
  const handleUndo = useCallback(async () => {
    const entry = undo()
    if (!entry) return

    try {
      setSaveStatus("saving")
      if (entry.action === "create" && entry.after) {
        // Undo create = delete
        await deleteAnnotation({ id: entry.after.id, documentId }).unwrap()
      } else if (entry.action === "delete" && entry.before) {
        // Undo delete = restore via create
        await createAnnotation(
          toCreateAnnotationInput(entry.before, documentId)
        ).unwrap()
      } else if (entry.action === "update" && entry.before) {
        const { content, color, positionData } = entry.before
        await updateAnnotation({
          id: entry.before.id,
          documentId,
          content: content ?? undefined,
          color,
          positionData,
        }).unwrap()
      }
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }, [
    undo,
    deleteAnnotation,
    createAnnotation,
    updateAnnotation,
    documentId,
    setSaveStatus,
  ])

  // Redo handler
  const handleRedo = useCallback(async () => {
    const entry = redo()
    if (!entry) return

    try {
      setSaveStatus("saving")
      if (entry.action === "create" && entry.after) {
        await createAnnotation(
          toCreateAnnotationInput(entry.after, documentId)
        ).unwrap()
      } else if (entry.action === "delete" && entry.before) {
        await deleteAnnotation({ id: entry.before.id, documentId }).unwrap()
      } else if (entry.action === "update" && entry.after) {
        const { content, color, positionData } = entry.after
        await updateAnnotation({
          id: entry.after.id,
          documentId,
          content: content ?? undefined,
          color,
          positionData,
        }).unwrap()
      }
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }, [
    redo,
    deleteAnnotation,
    createAnnotation,
    updateAnnotation,
    documentId,
    setSaveStatus,
  ])

  // Register annotation shortcuts
  useAnnotationShortcuts(undefined, handleUndo, handleRedo)

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

  // Flush unsaved annotation data on page unload via sendBeacon
  useEffect(() => {
    function onUnload() {
      // RTK Query mutations in flight will be cancelled; nothing to do here
      // for pending debounced saves, the component unmounts and useDebouncedMutation flushes
    }
    window.addEventListener("beforeunload", onUnload)
    return () => window.removeEventListener("beforeunload", onUnload)
  }, [])

  // Clear undo history on document change
  useEffect(() => {
    clearUndoHistory()
  }, [documentId, clearUndoHistory])

  // Load PDF
  useEffect(() => {
    if (!data?.document) return

    if (data.document.status !== "READY") {
      const interval = setInterval(() => {
        void refetch()
      }, 2000)
      return () => clearInterval(interval)
    }

    if (!data.document.storageKey) return

    let cancelled = false

    async function loadPdf() {
      try {
        const { getDocument } = await getPdfjsModule()
        const res = await fetch(
          `/api/documents/${documentId}/download?flavor=original`
        )
        if (!res.ok) throw new Error("Download URL unavailable")
        const { url } = await res.json()

        const loadingTask: PDFDocumentLoadingTask = getDocument(url)
        const pdf = await loadingTask.promise
        if (!cancelled) {
          setPdfDocument(pdf)
          setTotalPages(pdf.numPages)
          const lastPage = data?.readingProgress?.lastPage
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
  }, [
    data?.document,
    documentId,
    data?.readingProgress?.lastPage,
    initialPage,
    setPage,
    setTotalPages,
    refetch,
  ])

  const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

  useShortcuts([
    {
      key: "arrowleft",
      label: "←",
      category: "Navigation",
      description: "Previous page",
      handler: () => setPage(currentPage - 1),
    },
    {
      key: "arrowright",
      label: "→",
      category: "Navigation",
      description: "Next page",
      handler: () => setPage(currentPage + 1),
    },
    {
      key: "pageup",
      label: "PgUp",
      category: "Navigation",
      description: "Previous page",
      handler: () => setPage(currentPage - 1),
    },
    {
      key: "pagedown",
      label: "PgDn",
      category: "Navigation",
      description: "Next page",
      handler: () => setPage(currentPage + 1),
    },
    {
      key: "home",
      label: "Home",
      category: "Navigation",
      description: "First page",
      handler: () => setPage(1),
    },
    {
      key: "end",
      label: "End",
      category: "Navigation",
      description: "Last page",
      handler: () => setPage(totalPages),
    },
    {
      key: "+",
      label: "+",
      category: "View",
      description: "Zoom in",
      handler: () => {
        const next = ZOOM_STEPS.find((z) => z > zoom)
        if (next) setZoom(next)
      },
    },
    {
      key: "-",
      label: "-",
      category: "View",
      description: "Zoom out",
      handler: () => {
        const next = [...ZOOM_STEPS].reverse().find((z) => z < zoom)
        if (next) setZoom(next)
      },
    },
    {
      key: "0",
      label: "0",
      category: "View",
      description: "Fit width",
      handler: () => setZoom(1),
    },
    {
      key: "t",
      label: "T",
      category: "Sidebar",
      description: "Toggle thumbnails",
      handler: () => openSidebar("thumbnails"),
    },
    {
      key: "o",
      label: "O",
      category: "Sidebar",
      description: "Toggle outline",
      handler: () => openSidebar("outline"),
    },
    {
      key: "ctrl+f",
      label: "Ctrl+F",
      category: "Search",
      description: "Search in document",
      handler: () => openSearch(),
      allowInInput: false,
    },
    {
      key: "escape",
      label: "Esc",
      category: "General",
      description: "Close overlays",
      handler: () => {
        if (searchOpen) closeSearch()
        else if (shortcutsOpen) closeShortcuts()
      },
    },
    {
      key: "?",
      label: "?",
      category: "General",
      description: "Show shortcuts",
      handler: () => openShortcuts(),
    },
  ])

  if (isLoading || !pdfDocument) {
    const status = data?.document?.status
    return (
      <div className="flex h-full flex-col rounded-[2rem] border border-border/60 bg-card/55 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.65)]">
        {loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
            <p className="text-destructive">{loadError}</p>
            <button
              className="rounded-full border border-border/70 px-4 py-2 text-sm underline-offset-4 hover:bg-accent/50"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : status !== "READY" ? (
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex max-w-sm flex-col items-center gap-5 text-center">
              <div className="flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <Loader2 className="size-5 animate-spin" />
              </div>
              <div className="space-y-2">
                <p className="font-heading text-lg font-semibold text-foreground">
                  Preparing document
                </p>
                <p className="text-sm text-muted-foreground">
                  Your pages and annotations will appear here as soon as they
                  are ready.
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
  const downloadUrl: string | null = null

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/55 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.65)]">
      <OfflineBanner />

      <Toolbar
        documentId={documentId}
        documentName={documentName}
        downloadUrl={downloadUrl}
        saveStatusSlot={<SaveStatus className="ml-2" />}
        collaborators={data?.collaborators ?? []}
        canManageMembers={Boolean(data?.permissions.canManageMembers)}
      />

      {/* Reading progress bar */}
      <div className="relative h-0.5 w-full bg-muted/80">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-300"
          style={{
            width: `${totalPages > 0 ? ((currentPage - 1) / (totalPages - 1)) * 100 : 0}%`,
          }}
          role="progressbar"
          aria-label={`Reading progress: page ${currentPage} of ${totalPages}`}
          aria-valuenow={currentPage}
          aria-valuemin={1}
          aria-valuemax={totalPages}
        />
      </div>

      {/* Main body */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        {sidebarOpen && (
          <Sidebar
            documentId={documentId}
            pdfDocument={pdfDocument}
            totalPages={totalPages}
            outline={outline}
            className="hidden md:flex"
          />
        )}

        {/* Annotation toolbar (floating, left edge of PDF area) */}
        <div className="relative flex flex-col items-center px-1 py-4">
          <AnnotationToolbar />
        </div>

        {/* PDF viewer */}
        <PdfViewer
          pdfDocument={pdfDocument}
          documentId={documentId}
          onProgressUpdate={handleProgressUpdate}
        />

        {/* Right annotation panel */}
        {rightPanelAnnotationId && <AnnotationPanel documentId={documentId} />}

        {/* Search bar overlay */}
        <SearchBar documentId={documentId} />

        {/* Shortcuts overlay */}
        <ShortcutsOverlay />
      </div>

      {/* Bottom status bar */}
      <div className="flex h-8 shrink-0 items-center justify-end gap-3 border-t border-border/70 bg-card/75 px-4 text-xs text-muted-foreground backdrop-blur-xl">
        <span>
          Page {currentPage} of {totalPages || "—"}
          {totalPages > 0 && (
            <span className="ml-1 text-muted-foreground/70">
              (
              {Math.round(
                ((currentPage - 1) / Math.max(totalPages - 1, 1)) * 100
              )}
              %)
            </span>
          )}
        </span>
        <span>{Math.round(zoom * 100)}%</span>
        {annotations.length > 0 && (
          <span className="text-muted-foreground/60">
            {annotations.length} annotation{annotations.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )
}
