"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Search,
  Printer,
  Download,
  Share2,
  PanelLeft,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
} from "lucide-react"

import { useViewer } from "@/features/viewer/provider"
import {
  useListBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
} from "@/features/bookmarks/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

interface ToolbarProps {
  documentId: string
  documentName: string
  downloadUrl?: string | null
}

function Tip({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-border" aria-hidden />
}

export function Toolbar({
  documentId,
  documentName,
  downloadUrl,
}: ToolbarProps) {
  const zoom = useViewer((s) => s.zoom)
  const setZoom = useViewer((s) => s.setZoom)
  const currentPage = useViewer((s) => s.currentPage)
  const totalPages = useViewer((s) => s.totalPages)
  const setPage = useViewer((s) => s.setPage)
  const rotation = useViewer((s) => s.rotation)
  const setRotation = useViewer((s) => s.setRotation)
  const sidebarOpen = useViewer((s) => s.sidebarOpen)
  const toggleSidebar = useViewer((s) => s.toggleSidebar)
  const openSearch = useViewer((s) => s.openSearch)
  const searchOpen = useViewer((s) => s.searchOpen)

  const [pageInput, setPageInput] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: bookmarksRaw } = useListBookmarksQuery(documentId)
  // Guard against stale cache returning the raw { data: [] } wrapper shape
  const bookmarks = Array.isArray(bookmarksRaw) ? bookmarksRaw : []
  const [createBookmark] = useCreateBookmarkMutation()
  const [deleteBookmark] = useDeleteBookmarkMutation()

  const currentBookmark = bookmarks.find((b) => b.pageNumber === currentPage)

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const n = parseInt(pageInput, 10)
    if (!isNaN(n)) setPage(n)
    setPageInput("")
    inputRef.current?.blur()
  }

  const zoomIn = () => {
    const next = ZOOM_STEPS.find((z) => z > zoom)
    if (next) setZoom(next)
  }
  const zoomOut = () => {
    const next = [...ZOOM_STEPS].reverse().find((z) => z < zoom)
    if (next) setZoom(next)
  }
  const rotate = () => {
    setRotation(((rotation + 90) % 360) as 0 | 90 | 180 | 270)
  }
  const toggleBookmark = () => {
    if (currentBookmark) {
      void deleteBookmark({ documentId, bookmarkId: currentBookmark.id })
    } else {
      void createBookmark({ documentId, pageNumber: currentPage })
    }
  }

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-1 border-b border-border/70 bg-card/75 px-2 backdrop-blur-xl"
      role="toolbar"
      aria-label="PDF viewer controls"
    >
      {/* Back to library */}
      <Tip label="Back to library">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link href="/app">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
      </Tip>

      {/* Toggle sidebar */}
      <Tip label={`${sidebarOpen ? "Hide" : "Show"} sidebar (T)`}>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={toggleSidebar}
          aria-pressed={sidebarOpen}
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
      </Tip>

      <Divider />

      {/* Page navigation */}
      <Tip label="Previous page (←)">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={() => setPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </Tip>

      <form onSubmit={handlePageSubmit} className="flex items-center gap-1">
        <Input
          ref={inputRef}
          value={pageInput || String(currentPage)}
          onChange={(e) => setPageInput(e.target.value)}
          onFocus={() => setPageInput(String(currentPage))}
          onBlur={() => setPageInput("")}
          className="h-7 w-12 text-center text-sm"
          aria-label="Current page"
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault()
              setPage(currentPage + 1)
            }
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setPage(currentPage - 1)
            }
          }}
        />
        <span className="text-xs text-muted-foreground">
          of {totalPages || "—"}
        </span>
      </form>

      <Tip label="Next page (→)">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={() => setPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </Tip>

      <Divider />

      {/* Zoom */}
      <Tip label="Zoom out (-)">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={zoomOut}
          disabled={zoom <= 0.25}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </Button>
      </Tip>

      <span className="min-w-[3rem] text-center text-xs text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>

      <Tip label="Zoom in (+)">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={zoomIn}
          disabled={zoom >= 4}
          aria-label="Zoom in"
        >
          <ZoomIn className="size-4" />
        </Button>
      </Tip>

      <Tip label="Fit width (0)">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-[1rem] px-3 text-xs"
          onClick={() => setZoom(1)}
          aria-label="Fit width"
        >
          Fit
        </Button>
      </Tip>

      <Divider />

      {/* Rotate */}
      <Tip label="Rotate 90°">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-[1rem]"
          onClick={rotate}
          aria-label="Rotate 90 degrees"
        >
          <RotateCw className="size-4" />
        </Button>
      </Tip>

      <Divider />

      {/* Document title */}
      <span className="hidden max-w-[220px] truncate rounded-full border border-border/70 bg-card/75 px-3 py-1 text-sm font-medium md:block">
        {documentName}
      </span>

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Bookmark toggle */}
        <Tip
          label={currentBookmark ? "Remove bookmark (B)" : "Bookmark page (B)"}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-[1rem]"
            onClick={toggleBookmark}
            aria-label={
              currentBookmark ? "Remove bookmark" : "Bookmark this page"
            }
            aria-pressed={!!currentBookmark}
          >
            {currentBookmark ? (
              <BookmarkCheck className="size-4 text-primary" />
            ) : (
              <Bookmark className="size-4" />
            )}
          </Button>
        </Tip>

        {/* Search */}
        <Tip label="Search in document (Ctrl+F)">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-[1rem]"
            onClick={openSearch}
            aria-pressed={searchOpen}
            aria-label="Search in document"
          >
            <Search className="size-4" />
          </Button>
        </Tip>

        {/* Print */}
        <Tip label="Print">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-[1rem]"
            onClick={() => window.print()}
            aria-label="Print document"
          >
            <Printer className="size-4" />
          </Button>
        </Tip>

        {/* Download */}
        {downloadUrl && (
          <Tip label="Download original PDF">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-[1rem]"
              asChild
              aria-label="Download document"
            >
              <a href={downloadUrl} download>
                <Download className="size-4" />
              </a>
            </Button>
          </Tip>
        )}

        {/* Share (Phase 7 placeholder) */}
        <Tip label="Share (coming soon)">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-[1rem]"
            disabled
            aria-label="Share document (coming soon)"
          >
            <Share2 className="size-4" />
          </Button>
        </Tip>
      </div>
    </header>
  )
}
