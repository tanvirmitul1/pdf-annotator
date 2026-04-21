"use client"

import { useEffect, useRef, useCallback } from "react"
import type { PDFDocumentProxy, PDFDocumentLoadingTask } from "pdfjs-dist"
import { useState } from "react"

import { ViewerProvider, useViewer } from "@/features/viewer/provider"
import {
  useGetDocumentViewerDataQuery,
  useUpdateReadingProgressMutation,
} from "@/features/viewer/api"
import { useShortcuts } from "@/hooks/use-shortcuts"
import { Toolbar } from "./toolbar"
import { Sidebar } from "./sidebar"
import { PdfViewer } from "./pdf-viewer"
import { SearchBar } from "./search-bar"
import { ShortcutsOverlay } from "./shortcuts-overlay"
import { OfflineBanner } from "./offline-banner"
import { ViewerSkeleton } from "./viewer-skeleton"
import { cn } from "@/lib/utils"

type PdfjsModule = typeof import("pdfjs-dist")

let pdfjsModulePromise: Promise<PdfjsModule> | null = null

async function getPdfjsModule(): Promise<PdfjsModule> {
  if (!pdfjsModulePromise) {
    // webpackIgnore tells webpack to emit a native dynamic import instead of
    // bundling pdfjs-dist. This is required because webpack/SWC transpiles
    // pdfjs's native static private class fields (static #canvasInUse = new WeakSet())
    // incorrectly, producing "Object.defineProperty called on non-object" at render time.
    // Loading from /public as a plain browser ESM module avoids the transpilation entirely.
    // @ts-expect-error — URL path import, not resolvable by TS; types come from PdfjsModule cast below
    pdfjsModulePromise = import(/* webpackIgnore: true */ "/pdf.min.mjs").then((mod) => {
      const pdfjs = mod as unknown as PdfjsModule
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
      return pdfjs
    })
  }
  return pdfjsModulePromise
}

export interface ViewerShellProps {
  documentId: string
  documentName: string
  initialPage?: number
}

export function ViewerShell({
  documentId,
  documentName,
  initialPage = 1,
}: ViewerShellProps) {
  return (
    <ViewerProvider documentId={documentId}>
      <ViewerShellInner
        documentId={documentId}
        documentName={documentName}
        initialPage={initialPage}
      />
    </ViewerProvider>
  )
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
  const rotation = useViewer((s) => s.rotation)
  const setRotation = useViewer((s) => s.setRotation)
  const toggleSidebar = useViewer((s) => s.toggleSidebar)
  const openSidebar = useViewer((s) => s.openSidebar)
  const openSearch = useViewer((s) => s.openSearch)
  const closeSearch = useViewer((s) => s.closeSearch)
  const searchOpen = useViewer((s) => s.searchOpen)
  const openShortcuts = useViewer((s) => s.openShortcuts)
  const closeShortcuts = useViewer((s) => s.closeShortcuts)
  const shortcutsOpen = useViewer((s) => s.shortcutsOpen)

  const { data, isLoading, refetch } = useGetDocumentViewerDataQuery(documentId)
  const [updateProgress] = useUpdateReadingProgressMutation()

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

  // Load PDF
  useEffect(() => {
    if (!data?.document) {
      return
    }

    if (data.document.status !== "READY") {
      const interval = setInterval(() => {
        void refetch()
      }, 2000)
      return () => {
        clearInterval(interval)
      }
    }

    if (!data.document.storageKey) {
      return
    }

    let cancelled = false

    async function loadPdf() {
      try {
        const { getDocument } = await getPdfjsModule()

        // Fetch a signed download URL then load
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
          // Restore last page from reading progress
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

  // Register keyboard shortcuts
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
      <div className="flex h-full flex-col">
        {loadError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-destructive">{loadError}</p>
            <button
              className="text-sm underline"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : status !== "READY" ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <ViewerSkeleton />
            <p className="text-sm text-muted-foreground">
              Preparing your document… this usually takes a few seconds.
            </p>
          </div>
        ) : (
          <ViewerSkeleton />
        )}
      </div>
    )
  }

  const outline = data?.outline ?? null
  const downloadUrl: string | null = null // fetched on demand via toolbar

  return (
    <div className="flex h-full flex-col">
      <OfflineBanner />

      <Toolbar
        documentId={documentId}
        documentName={documentName}
        downloadUrl={downloadUrl}
      />

      {/* Reading progress bar */}
      <div className="relative h-0.5 w-full bg-muted">
        <div
          className="absolute left-0 top-0 h-full bg-primary transition-all duration-300"
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

        {/* PDF viewer */}
        <PdfViewer
          pdfDocument={pdfDocument}
          onProgressUpdate={handleProgressUpdate}
        />

        {/* Search bar overlay */}
        <SearchBar documentId={documentId} />

        {/* Shortcuts overlay */}
        <ShortcutsOverlay />
      </div>

      {/* Bottom status bar */}
      <div className="flex h-6 shrink-0 items-center justify-end gap-3 border-t border-border bg-card px-4 text-xs text-muted-foreground">
        <span>
          Page {currentPage} of {totalPages || "—"}
          {totalPages > 0 && (
            <span className="ml-1 text-muted-foreground/70">
              ({Math.round(((currentPage - 1) / Math.max(totalPages - 1, 1)) * 100)}%)
            </span>
          )}
        </span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  )
}
