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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search documents..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-11 max-w-sm rounded-[1rem] border-border/70 bg-card/80 px-4 text-sm"
        />
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Sort by:</span>
          <div className="flex gap-1 rounded-[1rem] border border-border/70 bg-card/80 p-1">
            <Button
              variant={sortBy === "createdAt" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-[0.7rem] px-3 text-xs"
              onClick={() => setSortBy("createdAt")}
            >
              Recent
            </Button>
            <Button
              variant={sortBy === "lastOpenedAt" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-[0.7rem] px-3 text-xs"
              onClick={() => setSortBy("lastOpenedAt")}
            >
              Last Opened
            </Button>
            <Button
              variant={sortBy === "name" ? "default" : "ghost"}
              size="sm"
              className="h-8 rounded-[0.7rem] px-3 text-xs"
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
              "group flex items-center gap-4 rounded-[1.4rem] border border-border/70 bg-card/70 p-4 transition duration-150",
              !showDeleted &&
                "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[0_24px_60px_-42px_rgba(15,23,42,0.55)]"
            )}
          >
            <Link
              href={`/app/documents/${doc.id}`}
              className={cn(
                "flex flex-1 items-center gap-4 rounded-[1rem] focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
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
                <p className="mt-0.5 text-xs text-muted-foreground">
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

            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
                      "size-9 rounded-[1rem] border-border/70 bg-card/75 transition-colors active:scale-95",
                      confirmDeleteId === doc.id
                        ? "text-destructive-foreground border-destructive bg-destructive hover:bg-destructive/90"
                        : "hover:border-destructive/40 hover:text-destructive"
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
