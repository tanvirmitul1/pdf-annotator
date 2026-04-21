"use client"

import { useState, useRef } from "react"
import { Bookmark, Trash2, Pencil, Check, X, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

import { useViewer } from "@/features/viewer/provider"
import {
  useListBookmarksQuery,
  useCreateBookmarkMutation,
  useDeleteBookmarkMutation,
  useRenameBookmarkMutation,
} from "@/features/bookmarks/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface BookmarksPanelProps {
  documentId: string
}

export function BookmarksPanel({ documentId }: BookmarksPanelProps) {
  const currentPage = useViewer((s) => s.currentPage)
  const setPage = useViewer((s) => s.setPage)

  const { data: bookmarks = [] } = useListBookmarksQuery(documentId)
  const [createBookmark] = useCreateBookmarkMutation()
  const [deleteBookmark] = useDeleteBookmarkMutation()
  const [renameBookmark] = useRenameBookmarkMutation()

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState("")

  const alreadyBookmarked = bookmarks.some((b) => b.pageNumber === currentPage)

  const handleAddBookmark = () => {
    void createBookmark({
      documentId,
      pageNumber: currentPage,
    })
  }

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      void deleteBookmark({ documentId, bookmarkId: id })
      setConfirmDeleteId(null)
    } else {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
    }
  }

  const handleStartEdit = (id: string, currentLabel: string | null) => {
    setEditingId(id)
    setEditLabel(currentLabel ?? "")
  }

  const handleSaveEdit = (id: string) => {
    void renameBookmark({ documentId, bookmarkId: id, label: editLabel })
    setEditingId(null)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Add bookmark button */}
      <div className="border-b border-border p-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleAddBookmark}
          disabled={alreadyBookmarked}
        >
          <Plus className="size-4" />
          {alreadyBookmarked
            ? `Page ${currentPage} bookmarked`
            : `Add bookmark for page ${currentPage}`}
        </Button>
      </div>

      {/* Bookmark list */}
      <div className="flex-1 overflow-y-auto">
        {bookmarks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <Bookmark className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No bookmarks yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookmarks.map((bm) => (
              <li key={bm.id} className="group flex items-start gap-2 p-2">
                {editingId === bm.id ? (
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-7 flex-1 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(bm.id)
                        if (e.key === "Escape") setEditingId(null)
                      }}
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => handleSaveEdit(bm.id)}
                      aria-label="Save label"
                    >
                      <Check className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => setEditingId(null)}
                      aria-label="Cancel edit"
                    >
                      <X className="size-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex flex-1 cursor-pointer flex-col text-left hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      onClick={() => setPage(bm.pageNumber)}
                      onDoubleClick={() => handleStartEdit(bm.id, bm.label)}
                      aria-label={`Go to bookmark on page ${bm.pageNumber}`}
                    >
                      <span className="text-xs font-semibold">
                        Page {bm.pageNumber}
                      </span>
                      {bm.label && (
                        <span className="truncate text-xs text-muted-foreground">
                          {bm.label}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground/70">
                        {formatDistanceToNow(new Date(bm.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </button>
                    <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6"
                        onClick={() => handleStartEdit(bm.id, bm.label)}
                        aria-label="Edit label"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "size-6",
                          confirmDeleteId === bm.id &&
                            "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        )}
                        onClick={() => handleDelete(bm.id)}
                        aria-label={
                          confirmDeleteId === bm.id
                            ? "Click again to confirm delete"
                            : "Delete bookmark"
                        }
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
