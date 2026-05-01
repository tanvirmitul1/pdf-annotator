"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Trash2, X } from "lucide-react"
import { toast } from "sonner"

import {
  useAddTagMutation,
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useListByDocumentQuery,
  useRemoveTagMutation,
  useUpdateAnnotationMutation,
} from "@/features/annotations/api"
import type {
  AnnotationStatus,
  AnnotationType,
  ToolId,
} from "@/features/annotations/types"
import { useGetDocumentViewerDataQuery } from "@/features/viewer/api"
import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { useAppSelector } from "@/store/hooks"

import { ColorPicker } from "./color-picker"
import { TagInput } from "./tag-input"
import { CommentThread } from "./comment-thread"

const ANNOTATION_TYPE_TO_TOOL: Partial<Record<AnnotationType, ToolId>> = {
  HIGHLIGHT: "highlight",
  UNDERLINE: "underline",
  STRIKETHROUGH: "strikethrough",
  SQUIGGLY: "squiggly",
} as const

const TYPE_LABELS: Record<string, string> = {
  HIGHLIGHT: "Highlight",
  UNDERLINE: "Underline",
  STRIKETHROUGH: "Strikethrough",
  SQUIGGLY: "Squiggly underline",
  NOTE: "Sticky note",
  FREEHAND: "Freehand",
  RECTANGLE: "Rectangle",
  CIRCLE: "Circle",
  ARROW: "Arrow",
  TEXTBOX: "Text box",
}

const STATUS_OPTIONS: Array<{ value: AnnotationStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
]

function getInitials(
  name: string | null | undefined,
  email: string | null | undefined
) {
  const source = (name || email || "?").trim()
  return source.slice(0, 2).toUpperCase()
}

function getDisplayName(
  name: string | null | undefined,
  email: string | null | undefined
) {
  return name || email || "Unknown user"
}

function isAnnotationOwner(
  annotation: {
    author?: { id: string } | null
    userId: string
  },
  currentUserId?: string | null
) {
  if (!currentUserId) {
    return false
  }

  return (
    annotation.author?.id === currentUserId ||
    annotation.userId === currentUserId ||
    annotation.userId === "optimistic" ||
    annotation.userId === "local"
  )
}

interface AnnotationPanelProps {
  documentId: string
}

function getFocusableElements(root: HTMLElement | null) {
  if (!root) {
    return []
  }

  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled"))
}

export function AnnotationPanel({ documentId }: AnnotationPanelProps) {
  const annotationId = useViewer((state) => state.rightPanelAnnotationId)
  const closeAnnotation = useViewer((state) => state.closeAnnotation)
  const setSaveStatus = useViewer((state) => state.setSaveStatus)
  const pushUndo = useViewer((state) => state.pushUndo)
  const orphanedAnnotationIds = useViewer(
    (state) => state.orphanedAnnotationIds
  )
  const startRelocatingAnnotation = useViewer(
    (state) => state.startRelocatingAnnotation
  )
  const setTool = useViewer((state) => state.setTool)
  const currentUser = useAppSelector((state) => state.auth.user)

  const { data: annotations = [] } = useListByDocumentQuery(documentId)
  const { data: viewerData } = useGetDocumentViewerDataQuery(documentId)
  const annotation = annotations.find((item) => item.id === annotationId)
  const collaborators = useMemo(
    () => viewerData?.collaborators ?? [],
    [viewerData]
  )

  const [comment, setComment] = useState(annotation?.content ?? "")
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const deleteConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const panelRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [updateAnnotation] = useUpdateAnnotationMutation()
  const [createAnnotation] = useCreateAnnotationMutation()
  const [deleteAnnotation] = useDeleteAnnotationMutation()
  const [addTag] = useAddTagMutation()
  const [removeTag] = useRemoveTagMutation()

  useEffect(() => {
    setComment(annotation?.content ?? "")
    setDeleteConfirm(false)
  }, [annotation?.content, annotation?.id])

  useEffect(() => {
    return () => {
      if (deleteConfirmTimerRef.current) {
        clearTimeout(deleteConfirmTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!annotationId) {
      return
    }

    const focusable = getFocusableElements(panelRef.current)
    focusable[0]?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeAnnotation()
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const elements = getFocusableElements(panelRef.current)
      if (elements.length === 0) {
        return
      }

      const first = elements[0]
      const last = elements[elements.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [annotationId, closeAnnotation])

  useEffect(() => {
    if (
      !annotationId ||
      typeof window === "undefined" ||
      !window.matchMedia("(pointer: coarse)").matches
    ) {
      return
    }

    function onPointerDown(event: PointerEvent) {
      if (!panelRef.current) {
        return
      }

      if (!panelRef.current.contains(event.target as Node)) {
        closeAnnotation()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    return () => document.removeEventListener("pointerdown", onPointerDown)
  }, [annotationId, closeAnnotation])

  const triggerCommentSave = useCallback(
    async (content: string) => {
      if (!annotation || !currentUser) {
        return
      }

      if (!isAnnotationOwner(annotation, currentUser.id)) {
        return
      }

      const previous = annotation.content ?? ""
      if (content === previous) {
        return
      }

      setSaveStatus("saving")

      try {
        const updated = await updateAnnotation({
          id: annotation.id,
          documentId,
          content,
        }).unwrap()

        pushUndo({
          action: "update",
          before: annotation,
          after: updated,
        })

        setSaveStatus("saved")
        window.setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("offline")
      }
    },
    [
      annotation,
      currentUser,
      documentId,
      pushUndo,
      setSaveStatus,
      updateAnnotation,
    ]
  )

  const { flush: flushSave } = useDebouncedMutation(
    triggerCommentSave,
    300
  )

  useEffect(() => {
    function onBeforeUnload() {
      flushSave()
    }

    window.addEventListener("beforeunload", onBeforeUnload)
    return () => window.removeEventListener("beforeunload", onBeforeUnload)
  }, [flushSave])

  async function handleColorChange(color: string) {
    if (!annotation || color === annotation.color || !currentUser) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    setSaveStatus("saving")

    try {
      const updated = await updateAnnotation({
        id: annotation.id,
        documentId,
        color,
      }).unwrap()

      pushUndo({
        action: "update",
        before: annotation,
        after: updated,
      })

      setSaveStatus("saved")
      window.setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }

  async function handleAddTag(label: string) {
    if (!annotation || !currentUser) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    setSaveStatus("saving")

    try {
      await addTag({
        annotationId: annotation.id,
        documentId,
        label,
      }).unwrap()
      setSaveStatus("saved")
      window.setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }

  async function handleRemoveTag(tagId: string) {
    if (!annotation || !currentUser) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    setSaveStatus("saving")

    try {
      await removeTag({
        annotationId: annotation.id,
        documentId,
        tagId,
      }).unwrap()
      setSaveStatus("saved")
      window.setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }

  async function restoreDeletedAnnotation() {
    if (!annotation || !currentUser) {
      return
    }

    await createAnnotation({
      documentId,
      pageNumber: annotation.pageNumber,
      type: annotation.type,
      status: annotation.status,
      assigneeId: annotation.assignee?.id ?? null,
      color: annotation.color,
      positionData: annotation.positionData,
      ...(annotation.content ? { content: annotation.content } : {}),
    }).unwrap()

    // Note: The annotation is already in the cache via optimistic update
  }

  async function handleDelete() {
    if (!annotation || !currentUser) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    if (!deleteConfirm) {
      setDeleteConfirm(true)
      deleteConfirmTimerRef.current = setTimeout(() => {
        setDeleteConfirm(false)
      }, 3000)
      return
    }

    pushUndo({ action: "delete", before: annotation, after: null })

    try {
      await deleteAnnotation({ id: annotation.id, documentId }).unwrap()
      closeAnnotation()

      toast.success("Annotation deleted", {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            void restoreDeletedAnnotation()
          },
        },
      })
    } catch {
      setSaveStatus("offline")
    }
  }

  const quotedText = useMemo(() => {
    if (annotation?.positionData.kind !== "TEXT") {
      return null
    }

    return annotation.positionData.anchor.quotedText
  }, [annotation])

  const assignableCollaborators = useMemo(
    () =>
      collaborators.filter((collaborator) => collaborator.role !== "VIEWER"),
    [collaborators]
  )

  async function handleStatusChange(status: AnnotationStatus) {
    if (!annotation || !currentUser || annotation.status === status) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    setSaveStatus("saving")

    try {
      const updated = await updateAnnotation({
        id: annotation.id,
        documentId,
        status,
      }).unwrap()

      pushUndo({
        action: "update",
        before: annotation,
        after: updated,
      })

      setSaveStatus("saved")
      window.setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }

  async function handleAssigneeChange(assigneeId: string) {
    if (!annotation || !currentUser) {
      return
    }

    const nextAssigneeId = assigneeId || null
    if ((annotation.assignee?.id ?? null) === nextAssigneeId) {
      return
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return
    }

    setSaveStatus("saving")

    try {
      const updated = await updateAnnotation({
        id: annotation.id,
        documentId,
        assigneeId: nextAssigneeId,
      }).unwrap()

      pushUndo({
        action: "update",
        before: annotation,
        after: updated,
      })

      setSaveStatus("saved")
      window.setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("offline")
    }
  }

  if (!annotation) {
    return null
  }

  const orphaned = Boolean(orphanedAnnotationIds[annotation.id])
  const canRelocate = orphaned && annotation.positionData.kind === "TEXT"
  const contentLabel = annotation.type === "TEXTBOX" ? "Text" : "Comment"
  const contentPlaceholder =
    annotation.type === "TEXTBOX"
      ? "Type text for this box..."
      : "Add a comment..."
  const canEdit =
    Boolean(currentUser) && isAnnotationOwner(annotation, currentUser?.id)

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto flex h-full min-h-0 w-full flex-col overflow-hidden bg-card/40 backdrop-blur-3xl will-change-transform"
      role="dialog"
      aria-label="Annotation editor"
      aria-modal="false"
    >
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border/40 px-3 bg-muted/20">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {TYPE_LABELS[annotation.type] ?? "Annotation"}
        </span>
        <button
          type="button"
          aria-label="Close panel"
          onClick={closeAnnotation}
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          {quotedText ? (
            <div className="rounded-lg border-l-2 border-primary/40 bg-primary/5 px-3 py-2 italic">
              <p className="line-clamp-3 text-[11px] leading-relaxed text-foreground/70">
                &ldquo;{quotedText}&rdquo;
              </p>
            </div>
          ) : null}

          {orphaned && (
            <div className="rounded-md border border-amber-500/20 bg-amber-500/5 px-2.5 py-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
              Content moved. Relocation required.
            </div>
          )}

          {/* Author & Meta */}
          <div className="flex items-center gap-2.5 px-0.5">
            <Avatar className="size-7 ring-1 ring-border/50">
              <AvatarImage src={annotation.author?.image ?? undefined} />
              <AvatarFallback className="text-[9px] font-bold">{getInitials(annotation.author?.name, annotation.author?.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold text-foreground/90">
                {getDisplayName(annotation.author?.name, annotation.author?.email)}
              </p>
              <p className="text-[9px] font-medium text-muted-foreground opacity-60">
                {new Date(annotation.createdAt).toLocaleDateString()} at {new Date(annotation.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">Status</span>
              <select
                value={annotation.status}
                onChange={(e) => void handleStatusChange(e.target.value as AnnotationStatus)}
                className="h-8 w-full rounded-lg border border-border/40 bg-background/50 px-2 text-[11px] font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                disabled={!canEdit}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">Assignee</span>
              <select
                value={annotation.assignee?.id ?? ""}
                onChange={(e) => void handleAssigneeChange(e.target.value)}
                className="h-8 w-full rounded-lg border border-border/40 bg-background/50 px-2 text-[11px] font-medium focus:ring-1 focus:ring-primary outline-none transition-all"
                disabled={!canEdit}
              >
                <option value="">None</option>
                {assignableCollaborators.map((c) => (
                  <option key={c.id} value={c.id}>{getDisplayName(c.name, c.email)}</option>
                ))}
              </select>
            </div>
          </div>

          <Separator className="opacity-30" />

          {/* Color & Actions */}
          <div className="flex items-center justify-between">
             <div className="flex flex-col gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">Color</span>
                <ColorPicker
                  value={annotation.color}
                  onChange={handleColorChange}
                  size="sm"
                />
             </div>
             {canRelocate && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-[10px] font-bold border-amber-500/20 hover:bg-amber-500/5 text-amber-600"
                  onClick={() => {
                    startRelocatingAnnotation(annotation.id)
                    const tool = ANNOTATION_TYPE_TO_TOOL[annotation.type]
                    if (tool) setTool(tool)
                    toast.message("Select text to relocate.")
                  }}
                >
                  Relocate
                </Button>
             )}
          </div>

          <Separator className="opacity-30" />

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">
                {contentLabel}
              </span>
              {canEdit && !isEditingDescription && (
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(true)}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            
            {isEditingDescription ? (
              <div className="space-y-2.5">
                <Textarea
                  value={comment}
                  ref={textareaRef}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={contentPlaceholder}
                  className="min-h-[100px] text-xs font-medium bg-background/50 border-border/40 rounded-xl resize-none focus-visible:ring-1"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 px-3 text-[10px] font-bold rounded-lg" onClick={() => { void triggerCommentSave(comment); setIsEditingDescription(false); }}>
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 px-3 text-[10px] font-bold rounded-lg" onClick={() => { setComment(annotation?.content ?? ""); setIsEditingDescription(false); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : comment ? (
              <div className="rounded-xl bg-muted/20 p-3 ring-1 ring-border/20">
                <p className="text-[11px] leading-relaxed break-words whitespace-pre-wrap font-medium text-foreground/80">
                  {comment}
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/40 bg-muted/5 p-3 flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground italic font-medium">No description added yet.</p>
              </div>
            )}
          </div>

          <Separator className="opacity-30" />

          {/* Tags */}
          <div className="space-y-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground/60">Tags</span>
            <TagInput
              tags={annotation.tags}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              disabled={!canEdit}
            />
          </div>

          <Separator className="opacity-30" />

          <CommentThread
            annotationId={annotation.id}
            collaborators={collaborators}
          />

          <Separator className="opacity-30" />

          {/* Footer Actions */}
          <div className="pt-2">
             <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full h-8 text-[10px] font-bold text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all",
                  deleteConfirm && "bg-destructive text-destructive-foreground hover:bg-destructive hover:text-white"
                )}
                onClick={handleDelete}
             >
                <Trash2 className="mr-2 size-3" />
                {deleteConfirm ? "Click again to confirm delete" : "Delete Annotation"}
             </Button>
          </div>
          
          <p className="text-center text-[9px] text-muted-foreground/40 font-medium">
            Page {annotation.pageNumber}
          </p>
        </div>
      </ScrollArea>

      <style>{`
        @keyframes slideInRight {
          from { transform: translate3d(20px, 0, 0); opacity: 0; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
