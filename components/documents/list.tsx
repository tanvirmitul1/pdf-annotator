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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
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
        variant="outline"
        size="icon"
        className="size-9 rounded-[1rem] border-border/70 bg-card/75 hover:border-primary/35 hover:bg-accent/60 active:scale-95"
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
        className="h-9 rounded-[0.9rem] border-border/70 bg-card/80 text-sm"
        autoFocus
        onKeyDown={(event) => event.key === "Escape" && onDone()}
      />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        className="size-8 rounded-[0.9rem]"
        aria-label="Save"
      >
        <Check className="size-3.5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 rounded-[0.9rem]"
        onClick={onDone}
        aria-label="Cancel"
      >
        <X className="size-3.5" />
      </Button>
    </form>
  )
}

export function DocumentList({ showDeleted = false }: DocumentListProps) {
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "lastOpenedAt">("createdAt")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasProcessing, setHasProcessing] = useState(false)

  const { data, isLoading } = useListDocumentsQuery(
    { search, sort: sortBy, limit: 20 },
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

  const documents = (data?.items ?? []).filter((doc) =>
    showDeleted ? doc.deletedAt : !doc.deletedAt
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-[1.4rem] bg-muted/70"
          />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-[1.6rem] border border-dashed border-border/70 bg-card/55 py-16 text-center text-muted-foreground">
        <FileText className="mx-auto mb-3 size-10 opacity-40" />
        <p>{showDeleted ? "No deleted documents" : "No documents yet"}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-11 w-full rounded-[1rem] border-border/70 bg-card/80 px-4 text-sm sm:max-w-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-xs text-muted-foreground">Sort by:</span>
            <div className="grid grid-cols-3 gap-1 rounded-[1rem] border border-border/70 bg-card/80 p-1 sm:flex">
              <Button
                variant={sortBy === "createdAt" ? "default" : "ghost"}
                size="sm"
                className="h-9 rounded-[0.7rem] px-3 text-xs sm:h-8"
                onClick={() => setSortBy("createdAt")}
              >
                Recent
              </Button>
              <Button
                variant={sortBy === "lastOpenedAt" ? "default" : "ghost"}
                size="sm"
                className="h-9 rounded-[0.7rem] px-3 text-xs sm:h-8"
                onClick={() => setSortBy("lastOpenedAt")}
              >
                Last Opened
              </Button>
              <Button
                variant={sortBy === "name" ? "default" : "ghost"}
                size="sm"
                className="h-9 rounded-[0.7rem] px-3 text-xs sm:h-8"
                onClick={() => setSortBy("name")}
              >
                Name
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                "group flex flex-col gap-4 rounded-[1.4rem] border border-border/70 bg-card/70 p-4 transition duration-150 sm:flex-row sm:items-center",
                !showDeleted &&
                  "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.55)]"
              )}
            >
              <Link
                href={`/app/documents/${doc.id}`}
                className={cn(
                  "flex w-full min-w-0 flex-1 items-start gap-4 rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:items-center",
                  showDeleted && "pointer-events-none"
                )}
                tabIndex={showDeleted ? -1 : 0}
              >
                <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] bg-muted">
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
                    <p className="truncate font-heading text-lg font-semibold tracking-tight text-foreground">
                      {doc.name}
                    </p>
                  )}
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {doc.lastOpenedAt
                      ? `Opened ${formatDistanceToNow(new Date(doc.lastOpenedAt), { addSuffix: true })}`
                      : `Added ${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}`}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-card/80 px-2.5 text-xs"
                    >
                      {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                    {doc.status === "PROCESSING" ? (
                      <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1">
                        <Progress
                          value={doc.processingProgress ?? 0}
                          className="h-2 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {doc.processingProgress ?? 0}%
                        </span>
                      </div>
                    ) : null}
                    {doc.status === "FAILED" ? (
                      <div className="flex items-center gap-2 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1">
                        <span className="text-xs font-medium text-destructive">
                          Processing failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 rounded-full px-2 text-xs"
                          onClick={(event) => {
                            event.preventDefault()
                            void handleReprocess(doc.id)
                          }}
                          aria-label="Retry processing"
                        >
                          <RefreshCw className="size-3" />
                          Retry
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>

              <div className="flex w-full shrink-0 items-center justify-end gap-2 opacity-100 transition-opacity sm:w-auto sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                {!showDeleted ? <DownloadButton id={doc.id} /> : null}

                {!showDeleted && renamingId !== doc.id ? (
                  <Tip label="Rename">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-[1rem] border-border/70 bg-card/75 hover:border-primary/35 hover:bg-accent/60 active:scale-95"
                      onClick={() => setRenamingId(doc.id)}
                      aria-label="Rename document"
                    >
                      <Edit2 className="size-4" />
                    </Button>
                  </Tip>
                ) : null}

                {showDeleted ? (
                  <Tip label="Restore">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-[1rem] border-border/70 bg-card/75 hover:border-primary/35 hover:bg-accent/60 active:scale-95"
                      onClick={() => void handleRestore(doc.id, doc.name)}
                      aria-label="Restore document"
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                  </Tip>
                ) : (
                  <Tip label="Delete">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 rounded-[1rem] border-border/70 bg-card/75 transition-colors hover:border-destructive/40 hover:text-destructive active:scale-95"
                      onClick={() => setDeleteTarget({ id: doc.id, name: doc.name })}
                      aria-label="Delete document"
                    >
                      <Trash2 className="size-4" />
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
        <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-[1.5rem] border border-border/70 bg-card/95 p-5 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.7)] backdrop-blur-xl sm:max-w-md sm:p-6">
          <DialogHeader className="gap-2">
            <DialogTitle className="text-base font-semibold">
              Delete this document?
            </DialogTitle>
            <DialogDescription className="text-sm leading-6">
              {deleteTarget ? (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.name}</span>{" "}
                  will be moved to trash. You can restore it later from the trash page.
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
              className="w-full rounded-[0.9rem] sm:w-auto"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-[0.9rem] sm:w-auto"
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
