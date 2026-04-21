"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Download, Edit2, Trash2, RotateCcw, RefreshCw, FileText, Check, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useListDocumentsQuery,
  useDeleteDocumentMutation,
  useRestoreDocumentMutation,
  useRenameDocumentMutation,
  useDownloadDocumentQuery,
  useReprocessDocumentMutation,
} from "@/features/documents/api"
import { cn } from "@/lib/utils"

interface DocumentListProps {
  showDeleted?: boolean
}

function Tip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <TooltipProvider delayDuration={400}>
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

  // Open URL once it's fetched
  if (trigger && data?.url) {
    window.open(data.url, "_blank")
    setTrigger(false)
  }

  return (
    <Tip label="Download">
      <Button
        variant="outline"
        size="icon"
        className="size-8 hover:bg-accent active:scale-95"
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
    if (!value.trim() || value === name) { onDone(); return }
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
      onSubmit={(e) => { e.preventDefault(); void submit() }}
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-7 text-sm"
        autoFocus
        onKeyDown={(e) => e.key === "Escape" && onDone()}
      />
      <Button type="submit" variant="ghost" size="icon" className="size-7" aria-label="Save">
        <Check className="size-3" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className="size-7" onClick={onDone} aria-label="Cancel">
        <X className="size-3" />
      </Button>
    </form>
  )
}

export function DocumentList({ showDeleted = false }: DocumentListProps) {
  const [search, setSearch] = useState("")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { data, isLoading } = useListDocumentsQuery({
    search,
    sort: "lastOpenedAt",
    limit: 20,
  })

  // Poll every 5s while any document is still processing
  const hasProcessing = useMemo(
    () => data?.items?.some((doc) => doc.status === "PROCESSING") ?? false,
    [data?.items],
  )
  useListDocumentsQuery(
    { search, sort: "lastOpenedAt", limit: 20 },
    { pollingInterval: hasProcessing ? 5000 : 0 },
  )
  const [deleteDocument] = useDeleteDocumentMutation()
  const [restoreDocument] = useRestoreDocumentMutation()
  const [reprocessDocument] = useReprocessDocumentMutation()

  type ApiError = { data?: { error?: string } }

  const handleDelete = async (id: string, name: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id)
      setTimeout(() => setConfirmDeleteId(null), 3000)
      return
    }
    setConfirmDeleteId(null)
    try {
      await deleteDocument(id).unwrap()
      toast("Document deleted", { description: `${name} moved to trash.` })
    } catch (error: unknown) {
      const apiError = error as ApiError
      toast.error("Delete failed", {
        description:
          typeof apiError.data?.error === "string"
            ? apiError.data.error
            : "Something went wrong.",
      })
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
      toast("Reprocessing started", { description: "The document will be processed again." })
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
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <FileText className="mx-auto mb-3 size-10 opacity-40" />
        <p>{showDeleted ? "No deleted documents" : "No documents yet"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search documents…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="grid gap-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={cn(
              "group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all duration-150",
              !showDeleted && "hover:border-primary/40 hover:shadow-md"
            )}
          >
            {/* Clickable area → viewer */}
            <Link
              href={`/app/documents/${doc.id}`}
              className={cn(
                "flex flex-1 items-center gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded",
                showDeleted && "pointer-events-none"
              )}
              tabIndex={showDeleted ? -1 : 0}
            >
              {/* Thumbnail or placeholder */}
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                {doc.thumbnailKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/storage/${doc.thumbnailKey}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <FileText className="size-6 text-muted-foreground" />
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                {renamingId === doc.id ? (
                  <RenameInline
                    id={doc.id}
                    name={doc.name}
                    onDone={() => setRenamingId(null)}
                  />
                ) : (
                  <p className="truncate font-medium">{doc.name}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {doc.lastOpenedAt
                    ? `Opened ${formatDistanceToNow(new Date(doc.lastOpenedAt), { addSuffix: true })}`
                    : `Added ${formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}`}
                </p>
                <div className="mt-1 flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {(doc.fileSize / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                  {doc.status === "PROCESSING" && (
                    <div className="flex items-center gap-2">
                      <Progress value={doc.processingProgress ?? 0} className="h-2 w-24" />
                      <span className="text-xs text-muted-foreground">
                        {doc.processingProgress ?? 0}%
                      </span>
                    </div>
                  )}
                  {doc.status === "FAILED" && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Processing failed
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 gap-1 px-1.5 text-xs"
                        onClick={(e) => { e.preventDefault(); void handleReprocess(doc.id) }}
                        aria-label="Retry processing"
                      >
                        <RefreshCw className="size-3" />
                        Retry
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {!showDeleted && <DownloadButton id={doc.id} />}

              {!showDeleted && renamingId !== doc.id && (
                <Tip label="Rename">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 hover:bg-accent active:scale-95"
                    onClick={() => setRenamingId(doc.id)}
                    aria-label="Rename document"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                </Tip>
              )}

              {showDeleted ? (
                <Tip label="Restore">
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8 hover:bg-accent active:scale-95"
                    onClick={() => void handleRestore(doc.id, doc.name)}
                    aria-label="Restore document"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </Tip>
              ) : (
                <Tip
                  label={
                    confirmDeleteId === doc.id
                      ? "Click again to confirm"
                      : "Delete"
                  }
                >
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "size-8 active:scale-95 transition-colors",
                      confirmDeleteId === doc.id
                        ? "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "hover:border-destructive hover:text-destructive"
                    )}
                    onClick={() => void handleDelete(doc.id, doc.name)}
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
  )
}
