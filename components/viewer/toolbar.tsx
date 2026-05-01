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
  MoreVertical,
} from "lucide-react"
import type { DocumentMemberRole } from "@prisma/client"
import type { SessionUser } from "@/features/auth/slice"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { DocumentShareDialog } from "./document-share-dialog"
import { UserMenu } from "@/components/common/user-menu"
import { ThemeToggle } from "@/components/common/theme-toggle"
import { cn } from "@/lib/utils"

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
  /** Current user info for avatar dropdown */
  user?: SessionUser | null
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

function Divider({ className }: { className?: string }) {
  return <div className={cn("mx-1 h-5 w-px bg-border", className)} aria-hidden />
}

export function Toolbar({
  documentId,
  documentName,
  downloadUrl,
  saveStatusSlot,
  collaborators = [],
  canInviteMembers = false,
  canManageMembers = false,
  user,
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
      className="flex h-14 shrink-0 items-center gap-1 border-b border-border/60 bg-card/90 px-3 backdrop-blur-xl overflow-x-auto no-scrollbar"
      role="toolbar"
      aria-label="PDF viewer controls"
    >
      {/* Group: Navigation & Sidebar */}
      <div className="flex items-center gap-0.5">
        <Tip label="Back to library">
          <Button variant="ghost" size="icon" className="size-9 rounded-xl" asChild>
            <Link href="/app">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
        </Tip>

        <Tip label={`${sidebarOpen ? "Hide" : "Show"} sidebar (T)`}>
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-9 rounded-xl", sidebarOpen && "bg-accent")}
            onClick={toggleSidebar}
            aria-pressed={sidebarOpen}
          >
            <PanelLeft className="size-4" />
          </Button>
        </Tip>
      </div>

      <Divider className="hidden sm:block" />

      {/* Group: Page Control */}
      <div className="flex items-center gap-0.5">
        <Tip label="Previous page (←)">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>
        </Tip>

        <form onSubmit={handlePageSubmit} className="flex items-center gap-1.5 px-1">
          <Input
            ref={inputRef}
            value={pageInput || String(currentPage)}
            onChange={(e) => setPageInput(e.target.value)}
            onFocus={() => setPageInput(String(currentPage))}
            onBlur={() => setPageInput("")}
            className="h-8 w-11 border-none bg-accent/50 text-center text-xs font-bold tabular-nums focus-visible:ring-1"
          />
          <span className="hidden text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60 sm:inline">
            of {totalPages || "—"}
          </span>
        </form>

        <Tip label="Next page (→)">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 rounded-xl"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </Tip>
      </div>

      <Divider className="hidden md:block" />

      {/* Group: Zoom (Desktop only center) */}
      <div className="hidden items-center gap-0.5 lg:flex">
        <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={zoomOut} disabled={zoom <= 0.25}>
          <ZoomOut className="size-4" />
        </Button>
        
        <Tip label="Fit width (0)">
          <button 
            onClick={() => setZoom(1)}
            className="min-w-[4rem] text-center text-[11px] font-bold tabular-nums hover:text-primary transition-colors"
          >
            {Math.round(zoom * 100)}%
          </button>
        </Tip>

        <Button variant="ghost" size="icon" className="size-9 rounded-xl" onClick={zoomIn} disabled={zoom >= 4}>
          <ZoomIn className="size-4" />
        </Button>
      </div>

      {/* Group: Document Identity (Mobile: Hidden / Desktop: Centered or Right) */}
      <div className="hidden flex-1 min-w-0 items-center justify-center gap-3 px-4 md:flex">
        <div className="flex flex-col items-center min-w-0">
          <span className="max-w-[240px] truncate text-sm font-bold tracking-tight text-foreground">
            {documentName}
          </span>
          <div className="flex items-center gap-2">
            {saveStatusSlot}
            {collaborators.length > 1 && (
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest opacity-50">
                {collaborators.length} collaborators
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right-side actions */}
      <div className="ml-auto flex items-center gap-0.5">
        <div className="hidden items-center gap-0.5 sm:flex">
           <Tip label={currentBookmark ? "Remove bookmark (B)" : "Bookmark page (B)"}>
             <Button
               variant="ghost"
               size="icon"
               className="size-9 rounded-xl"
               onClick={toggleBookmark}
             >
               {currentBookmark ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
             </Button>
           </Tip>

           <Tip label="Search (Ctrl+F)">
             <Button
               variant="ghost"
               size="icon"
               className={cn("size-9 rounded-xl", searchOpen && "bg-accent")}
               onClick={openSearch}
             >
               <Search className="size-4" />
             </Button>
           </Tip>
        </div>

        <Divider className="hidden sm:block" />

        <div className="flex items-center gap-1.5 px-1">
          <Button
            variant="default"
            size="sm"
            className="h-9 gap-2 rounded-xl px-4 text-xs font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="size-3.5" />
            <span className="hidden sm:inline">Share</span>
          </Button>

          {/* More Actions Dropdown */}
          <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 rounded-xl">
                   <MoreVertical className="size-4" />
                </Button>
             </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5">
                <DropdownMenuItem onClick={() => window.print()} className="gap-2 rounded-lg">
                   <Printer className="size-4" />
                   <span>Print Document</span>
                </DropdownMenuItem>
                {downloadUrl && (
                  <DropdownMenuItem asChild className="gap-2 rounded-lg">
                    <a href={downloadUrl} download>
                      <Download className="size-4" />
                      <span>Download PDF</span>
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={rotate} className="gap-2 rounded-lg">
                   <RotateCw className="size-4" />
                   <span>Rotate View</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="flex items-center justify-between px-2 py-1.5">
                   <span className="text-xs font-medium">Dark Mode</span>
                   <ThemeToggle />
                </div>
             </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Divider />

        {/* User Group */}
        <div className="flex items-center gap-2 pl-1">
           <NotificationBell />
           {user && (
             <UserMenu
               name={user.name}
               email={user.email}
               image={user.image}
               planId={user.planId}
               role={user.role}
             />
           )}
        </div>
      </div>

      <DocumentShareDialog
        documentId={documentId}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        canInviteMembers={canInviteMembers}
        canManageMembers={canManageMembers}
      />
    </header>
  )
}

