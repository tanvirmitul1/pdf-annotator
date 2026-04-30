"use client"

import { useState, useMemo, useCallback, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import {
  Check,
  Download,
  Edit2,
  FileText,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useDeleteDocumentMutation,
  useDownloadDocumentQuery,
  useListDocumentsQuery,
  useRenameDocumentMutation,
  useReprocessDocumentMutation,
  useRestoreDocumentMutation,
} from "@/features/documents/api"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  showDeleted?: boolean
}


interface BulkDeleteState {
  isOpen: boolean
  selectedIds: string[]
  names?: string[]
  currentIndex: number
  total: number
  isCancelled: boolean
  errors: Array<{ id: string; name: string; error: string }>
}

function Tip({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function DownloadButton({ id }: { id: string }) {
  const [trigger, setTrigger] = useState(false)
  const { data } = useDownloadDocumentQuery(
    { id, flavor: "original" },
    { skip: !trigger }
  )

  const handleClick = () => {
    if (data?.url) {
      window.open(data.url, "_blank")
    } else {
      setTrigger(true)
    }
  }

  if (trigger && data?.url) {
    window.open(data.url, "_blank")
    setTrigger(false)
  }

  return (
    <Tip label="Download">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-md text-muted-foreground hover:text-foreground"
        onClick={handleClick}
        aria-label="Download document"
      >
        <Download className="size-4" />
      </Button>
    </Tip>
  )
}

function RenameInline({
  id,
  name,
  onDone,
}: {
  id: string
  name: string
  onDone: () => void
}) {
  const [value, setValue] = useState(name)
  const [rename] = useRenameDocumentMutation()

  const submit = async () => {
    if (!value.trim() || value === name) {
      onDone()
      return
    }

    try {
      await rename({ id, data: { name: value.trim() } }).unwrap()
      toast("Document renamed")
    } catch {
      toast.error("Rename failed")
    }

    onDone()
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="h-8 rounded-md border-border/60 bg-background text-sm"
        autoFocus
        onKeyDown={(event) => event.key === "Escape" && onDone()}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="size-7 rounded-md"
        aria-label="Save"
      >
        <Check className="size-3" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 rounded-md"
        onClick={onDone}
        aria-label="Cancel"
      >
        <X className="size-3" />
      </Button>
    </form>
  )
}

export function DocumentList({ showDeleted = false }: DocumentListProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "lastOpenedAt">(
    "createdAt"
  )
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDelete, setBulkDelete] = useState<BulkDeleteState>({
    isOpen: false,
    selectedIds: [],
    currentIndex: 0,
    total: 0,
    isCancelled: false,
    errors: [],
  })

  const { data, isLoading } = useListDocumentsQuery(
    { search, sort: sortBy, limit: 20, showDeleted },
    {
      pollingInterval: 0,
      refetchOnMountOrArgChange: true,
    }
  )

  const [deleteDocument] = useDeleteDocumentMutation()
  const [restoreDocument] = useRestoreDocumentMutation()
  const [reprocessDocument] = useReprocessDocumentMutation()

  type ApiError = { data?: { error?: string } }

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) {
      return
    }

    // Remove from selection if present
    if (selectedIds.has(deleteTarget.id)) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(deleteTarget.id)
        return next
      })
    }

    setIsDeleting(true)
    try {
      await deleteDocument(deleteTarget.id).unwrap()
      toast("Document deleted", {
        description: `${deleteTarget.name} moved to trash.`,
      })
      setDeleteTarget(null)
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast.error("Delete failed", {
        description:
          typeof apiError.data?.error === "string"
            ? apiError.data.error
            : "Something went wrong.",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelBulkDelete = () => {
    cancelRef.current = true
    setBulkDelete((prev) => ({ ...prev, isCancelled: true }))
  }

  // Ref for latest cancellation state
  const cancelRef = useRef(false)

  const handleRestore = async (id: string, name: string) => {
    try {
      await restoreDocument(id).unwrap()
      toast("Document restored", { description: `${name} has been restored.` })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast.error("Restore failed", {
        description:
          typeof apiError.data?.error === "string"
            ? apiError.data.error
            : "Something went wrong.",
      })
    }
  }

  const handleReprocess = async (id: string) => {
    try {
      await reprocessDocument(id).unwrap()
      toast("Reprocessing started", {
        description: "The document will be processed again.",
      })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast.error("Reprocess failed", {
        description:
          typeof apiError.data?.error === "string"
            ? apiError.data.error
            : "Something went wrong.",
      })
    }
  }

  const documents = useMemo(() => data?.items ?? [], [data?.items])

  // Selection helpers
  const visibleIds = useMemo(() => documents.map((d) => d.id), [documents])

  const isAllSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))

  const toggleSelection = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) {
        next.add(id)
      } else {
        next.delete(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(visibleIds))
    } else {
      setSelectedIds(new Set())
    }
  }, [visibleIds])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const selectedCount = selectedIds.size

  // Sequential bulk delete with progress
  const runBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds)
    if (idsToDelete.length === 0) return

    setBulkDelete({
      isOpen: true,
      selectedIds: idsToDelete,
      names: idsToDelete.map(id => documents.find(d => d.id === id)?.name ?? "Unknown"),
      currentIndex: 0,
      total: idsToDelete.length,
      isCancelled: false,
      errors: [],
    })

    const errors: BulkDeleteState["errors"] = []

    for (let i = 0; i < idsToDelete.length; i++) {
      if (cancelRef.current) break

      const id = idsToDelete[i]
      const doc = documents.find((d) => d.id === id)

      // Update progress
      setBulkDelete((prev) => ({
        ...prev,
        currentIndex: i,
      }))

      try {
        await deleteDocument(id).unwrap()
      } catch (error: unknown) {
        const apiError = error as ApiError
        errors.push({
          id,
          name: doc?.name ?? "Unknown",
          error: apiError.data?.error ?? "Delete failed",
        })
      }

      // Small delay to show progress and avoid overwhelming server
      await new Promise((resolve) => setTimeout(resolve, 150))
    }

    setBulkDelete((prev) => ({
      ...prev,
      isOpen: false,
    }))

    clearSelection()

    // Show summary toast
    const successCount = idsToDelete.length - errors.length
    if (errors.length === 0) {
      toast.success(`Deleted ${successCount} document${successCount === 1 ? "" : "s"} successfully`)
    } else {
      toast.error(`Deleted ${successCount}, ${errors.length} failed`)
    }
   }, [selectedIds, deleteDocument, documents, clearSelection])

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-lg bg-muted/60"
          />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 py-16 text-center text-muted-foreground">
        <FileText className="mx-auto mb-3 size-8 opacity-30" />
        <p className="text-sm">
          {showDeleted ? "No deleted documents" : "No documents yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          Upload a PDF or image to get started
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-9 w-full rounded-md border-border/60 bg-muted/40 px-3 text-sm sm:max-w-xs"
          />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <div className="flex gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5">
              <Button
                variant={sortBy === "createdAt" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-sm px-2.5 text-xs"
                onClick={() => setSortBy("createdAt")}
              >
                Recent
              </Button>
              <Button
                variant={sortBy === "lastOpenedAt" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-sm px-2.5 text-xs"
                onClick={() => setSortBy("lastOpenedAt")}
              >
                Last Opened
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "ghost"}
                size="sm"
                className="h-7 rounded-sm px-2.5 text-xs"
                onClick={() => setSortBy("name")}
              >
                Name
              </Button>
            </div>
          </div>
        </div>

        {/* Select all bar - always visible when documents exist (not in trash) */}
        {!showDeleted && documents.length > 0 && (
          <div className="flex items-center gap-2 py-2">
            <Checkbox
              id="select-all-page"
              checked={isAllSelected}
              onCheckedChange={(checked: boolean) => toggleSelectAll(checked)}
              aria-label={`Select all ${documents.length} documents on this page`}
            />
            <label
              htmlFor="select-all-page"
              className="cursor-pointer text-sm font-medium select-none"
            >
              Select all {documents.length} document{documents.length === 1 ? "" : "s"}
            </label>
          </div>
        )}

        {/* Bulk action bar - shown when items selected */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-primary/10 px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {selectedCount} document{selectedCount === 1 ? "" : "s"} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => clearSelection()}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => runBulkDelete()}
                disabled={isDeleting}
              >
                <Trash2 className="mr-1.5 size-3.5" />
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/50 bg-card/60">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "group flex flex-col gap-3 bg-card/40 px-4 py-3.5 transition-colors duration-150 sm:flex-row sm:items-center",
                !showDeleted && "hover:bg-muted/40",
                selectedIds.has(doc.id) && "bg-primary/10"
              )}
            >
              {/* Checkbox column */}
              {!showDeleted && (
                <div className="flex shrink-0 items-center pr-2">
                  <Checkbox
                    id={`select-${doc.id}`}
                    checked={selectedIds.has(doc.id)}
                    onCheckedChange={(checked: boolean) => toggleSelection(doc.id, checked)}
                    aria-label={`Select ${doc.name}`}
                    className="size-4"
                  />
                </div>
              )}

              <Link
                href={`/app/documents/${doc.id}`}
                className={cn(
                  "flex w-full min-w-0 flex-1 items-center gap-3.5 rounded-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
                  showDeleted && "pointer-events-none"
                )}
                tabIndex={showDeleted ? -1 : 0}
              >
                <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/40 bg-muted/80">
                  {doc.thumbnailKey ? (
                    <Image
                      src={`/api/storage/${doc.thumbnailKey}`}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <FileText className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  {renamingId === doc.id ? (
                    <RenameInline
                      id={doc.id}
                      name={doc.name}
                      onDone={() => setRenamingId(null)}
                    />
                  ) : (
                    <p className="truncate text-sm font-semibold text-foreground">
                      {doc.name}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {doc.lastOpenedAt
                        ? `Opened ${formatDistanceToNow(new Date(doc.lastOpenedAt), { addSuffix: true })}`
                        : `Added ${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}`}
                    </span>
                    <span className="text-xs text-muted-foreground/40">·</span>
                    <span className="text-xs text-muted-foreground/70">
                      {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                    {doc.status === "PROCESSING" ? (
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${doc.processingProgress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {doc.processingProgress ?? 0}%
                        </span>
                      </div>
                    ) : null}
                    {doc.status === "FAILED" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-destructive">
                          Failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 rounded px-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={(event) => {
                            event.preventDefault()
                            void handleReprocess(doc.id)
                          }}
                          aria-label="Retry processing"
                        >
                          <RefreshCw className="mr-1 size-2.5" />
                          Retry
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>

              <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                {!showDeleted ? <DownloadButton id={doc.id} /> : null}

                {!showDeleted && renamingId !== doc.id ? (
                  <Tip label="Rename">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                      onClick={() => setRenamingId(doc.id)}
                      aria-label="Rename document"
                    >
                      <Edit2 className="size-3.5" />
                    </Button>
                  </Tip>
                ) : null}

                {showDeleted ? (
                  <Tip label="Restore">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-muted-foreground hover:text-foreground"
                      onClick={() => void handleRestore(doc.id, doc.name)}
                      aria-label="Restore document"
                    >
                      <RotateCcw className="size-3.5" />
                    </Button>
                  </Tip>
                ) : (
                  <Tip label="Delete">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 rounded-md text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        setDeleteTarget({ id: doc.id, name: doc.name })
                      }
                      aria-label="Delete document"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </Tip>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent
          className="rounded-xl border border-border/60 bg-card/95 p-4 backdrop-blur-xl sm:p-6"
          size="sm"
        >
          <DialogHeader className="gap-2">
            <DialogTitle className="text-base font-semibold">
              Delete this document?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">
                    {deleteTarget.name}
                  </span>{" "}
                  will be moved to trash. You can restore it later from the
                  trash page.
                </>
              ) : (
                "This document will be moved to trash."
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => void handleDelete()}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Progress Dialog */}
      <Dialog
        open={bulkDelete.isOpen}
        onOpenChange={(open) => {
          if (!open && !bulkDelete.isCancelled) {
            // Don't allow closing while in progress; cancel must be clicked
          }
        }}
      >
        <DialogContent
          className="rounded-xl border border-border/60 bg-card/95 p-6 backdrop-blur-xl sm:max-w-md"
          size="sm"
        >
          <DialogHeader className="gap-3">
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <div className="flex size-5 items-center justify-center">
                {bulkDelete.currentIndex < bulkDelete.total ? (
                  <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <CheckCircle2 className="size-4 text-primary" />
                )}
              </div>
              Deleting documents...
            </DialogTitle>
            <DialogDescription className="space-y-3 text-sm leading-6">
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{
                        width: `${((bulkDelete.currentIndex + (bulkDelete.isCancelled ? 0 : 1)) / bulkDelete.total) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {bulkDelete.currentIndex + (bulkDelete.isCancelled ? 0 : 1)}/{bulkDelete.total}
                </span>
              </div>

              {/* Current item */}
              {bulkDelete.names && bulkDelete.currentIndex < bulkDelete.total && (
                <p className="text-foreground/80">
                  Deleting: <span className="font-medium text-foreground">
                    {bulkDelete.names[bulkDelete.currentIndex]}
                  </span>
                </p>
              )}

              {/* Errors */}
              {bulkDelete.errors.length > 0 && (
                <div className="mt-2 space-y-1 rounded-lg bg-destructive/10 p-3">
                  <p className="text-xs font-medium text-destructive">
                    Failed to delete {bulkDelete.errors.length} document{bulkDelete.errors.length === 1 ? "" : "s"}:
                  </p>
                  <ul className="space-y-0.5">
                    {bulkDelete.errors.slice(0, 3).map((err) => (
                      <li key={err.id} className="text-xs text-destructive/80 truncate" title={err.name}>
                        {err.name}: {err.error}
                      </li>
                    ))}
                    {bulkDelete.errors.length > 3 && (
                      <li className="text-xs text-destructive/70">
                        +{bulkDelete.errors.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={cancelBulkDelete}
              disabled={bulkDelete.currentIndex >= bulkDelete.total}
            >
              {bulkDelete.isCancelled ? "Cancelled" : "Cancel"}
            </Button>
            {!bulkDelete.isCancelled && bulkDelete.currentIndex >= bulkDelete.total && (
              <Button
                type="button"
                className="w-full sm:w-auto"
                onClick={() => setBulkDelete((prev) => ({ ...prev, isOpen: false }))}
              >
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
