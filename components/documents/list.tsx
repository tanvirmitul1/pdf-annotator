"use client"

import { useState } from "react"
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
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
  const [hasProcessing, setHasProcessing] = useState(false)

  const { data, isLoading } = useListDocumentsQuery(
    { search, sort: sortBy, limit: 20, showDeleted },
    {
      pollingInterval: hasProcessing ? 3000 : 0,
      refetchOnMountOrArgChange: true,
    }
  )

  // Update polling state when data changes
  if (data?.items) {
    const shouldPoll = data.items.some((doc) => doc.status === "PROCESSING")
    if (shouldPoll !== hasProcessing) {
      setHasProcessing(shouldPoll)
    }
  }

  const [deleteDocument] = useDeleteDocumentMutation()
  const [restoreDocument] = useRestoreDocumentMutation()
  const [reprocessDocument] = useReprocessDocumentMutation()

  type ApiError = { data?: { error?: string } }

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) {
      return
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

  const documents = data?.items ?? []

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

        <div className="divide-y divide-border/40 overflow-hidden rounded-lg border border-border/50 bg-card/60">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "group flex flex-col gap-3 bg-card/40 px-4 py-3.5 transition-colors duration-150 sm:flex-row sm:items-center",
                !showDeleted && "hover:bg-muted/40"
              )}
            >
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
    </>
  )
}
