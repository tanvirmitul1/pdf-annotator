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
import type { DocumentMemberRole } from "@prisma/client"

import { useViewer } from "@/features/viewer/provider"
import {
  useListBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
} from "@/features/bookmarks/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { DocumentShareDialog } from "./document-share-dialog"

const ZOOM_STEPS = [0.25, 0.33, 0.5, 0.67, 0.75, 1, 1.25, 1.5, 2, 3, 4]

interface ToolbarProps {
  documentId: string
  documentName: string
  downloadUrl?: string | null
  saveStatusSlot?: React.ReactNode
  collaborators?: Array<{
    id: string
    name: string | null
    email: string | null
    image: string | null
    role: DocumentMemberRole | "OWNER"
  }>
  canInviteMembers?: boolean
  canManageMembers?: boolean
}

function initials(name: string | null, email: string | null) {
  return (name || email || "?").slice(0, 2).toUpperCase()
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
  saveStatusSlot,
  collaborators = [],
  canInviteMembers = false,
  canManageMembers = false,
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
  const [showShareDialog, setShowShareDialog] = useState(false)
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
      className="flex h-12 shrink-0 items-center gap-1 border-b border-border/60 bg-card/90 px-2 backdrop-blur-xl"
      role="toolbar"
      aria-label="PDF viewer controls"
    >
      {/* Back to library */}
      <Tip label="Back to library">
        <Button variant="ghost" size="icon" className="size-8 rounded-md" asChild>
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
          className="size-8 rounded-md"
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
          className="size-8 rounded-md"
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
          className="size-8 rounded-md"
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
          className="size-8 rounded-md"
          onClick={zoomOut}
          disabled={zoom <= 0.25}
          aria-label="Zoom out"
        >
          <ZoomOut className="size-4" />
        </Button>
      </Tip>

      <span className="min-w-[3rem] text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>

      <Tip label="Zoom in (+)">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-md"
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
          className="h-7 rounded-md px-2.5 text-xs"
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
          className="size-8 rounded-md"
          onClick={rotate}
          aria-label="Rotate 90 degrees"
        >
          <RotateCw className="size-4" />
        </Button>
      </Tip>

      <Divider />

      {/* Document title */}
      <div className="hidden min-w-0 items-center gap-3 md:flex">
        <span className="max-w-[200px] truncate text-sm font-medium text-foreground">
          {documentName}
        </span>
        {collaborators.length > 0 ? (
          <AvatarGroup>
            {collaborators.slice(0, 4).map((collaborator) => (
              <Avatar
                key={collaborator.id}
                size="sm"
                title={`${collaborator.name || collaborator.email || "Collaborator"} (${collaborator.role})`}
              >
                <AvatarImage
                  src={collaborator.image ?? undefined}
                  alt={collaborator.name ?? "Collaborator"}
                />
                <AvatarFallback>
                  {initials(collaborator.name, collaborator.email)}
                </AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        ) : null}
      </div>

      {/* Save status slot */}
      {saveStatusSlot}

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-0.5">
        {/* Bookmark toggle */}
        <Tip
          label={currentBookmark ? "Remove bookmark (B)" : "Bookmark page (B)"}
        >
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-md"
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
            className="size-8 rounded-md"
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
            className="size-8 rounded-md"
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
              className="size-8 rounded-md"
              asChild
              aria-label="Download document"
            >
              <a href={downloadUrl} download>
                <Download className="size-4" />
              </a>
            </Button>
          </Tip>
        )}

        <Divider />

        {/* Share Button */}
        <Tip label="Share document">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 rounded-md px-2.5 text-xs"
            onClick={() => setShowShareDialog(true)}
            aria-label="Share document"
          >
            <Share2 className="size-3.5" />
            Share
          </Button>
        </Tip>

        {/* Share Dialog */}
        <DocumentShareDialog
          documentId={documentId}
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          canInviteMembers={canInviteMembers}
          canManageMembers={canManageMembers}
        />

        <NotificationBell />
      </div>
    </header>
  )
}
