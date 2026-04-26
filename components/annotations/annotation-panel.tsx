"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { AtSign, Trash2, X } from "lucide-react"
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
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
    annotation.userId === "optimistic"
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
  const [selectionStart, setSelectionStart] = useState(0)

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

  const { call: debouncedSave, flush: flushSave } = useDebouncedMutation(
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

    const recreated = await createAnnotation({
      documentId,
      pageNumber: annotation.pageNumber,
      type: annotation.type,
      status: annotation.status,
      assigneeId: annotation.assignee?.id ?? null,
      color: annotation.color,
      positionData: annotation.positionData,
      ...(annotation.content ? { content: annotation.content } : {}),
    }).unwrap()

    pushUndo({ action: "create", before: null, after: recreated })
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

  const selectionIndex = textareaRef.current?.selectionStart ?? selectionStart
  const mentionMatch = useMemo(() => {
    const beforeCaret = comment.slice(0, selectionIndex)
    return /(?:^|\s)@([^\s@]*)$/.exec(beforeCaret)
  }, [comment, selectionIndex])
  const mentionCandidates = useMemo(() => {
    const query = mentionMatch?.[1]?.toLowerCase() ?? ""
    if (!query || !annotation || !currentUser) {
      return []
    }

    if (!isAnnotationOwner(annotation, currentUser.id)) {
      return []
    }

    return collaborators
      .filter((collaborator) => collaborator.id !== currentUser.id)
      .filter((collaborator) => {
        const haystack =
          `${collaborator.name ?? ""} ${collaborator.email ?? ""}`.toLowerCase()
        return haystack.includes(query)
      })
      .slice(0, 5)
  }, [annotation, collaborators, currentUser, mentionMatch])

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

  function insertMention(label: string) {
    if (!mentionMatch) {
      return
    }

    const start =
      selectionIndex - mentionMatch[0].length + mentionMatch[0].indexOf("@")
    const end = selectionIndex
    const nextValue = `${comment.slice(0, start)}@${label} ${comment.slice(end)}`
    setComment(nextValue)
    debouncedSave(nextValue)
    requestAnimationFrame(() => {
      textareaRef.current?.focus()
      const caret = start + label.length + 2
      textareaRef.current?.setSelectionRange(caret, caret)
      setSelectionStart(caret)
    })
  }

  return (
    <div
      ref={panelRef}
      className="flex w-80 shrink-0 flex-col border-l border-border/60 bg-card/90 backdrop-blur-xl"
      role="dialog"
      aria-label="Annotation editor"
      aria-modal="false"
      style={{ animation: "slideInRight 180ms ease-out both" }}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3">
        <span className="text-sm font-medium">
          {TYPE_LABELS[annotation.type] ?? annotation.type}
        </span>
        <button
          type="button"
          aria-label="Close panel"
          onClick={closeAnnotation}
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <X className="size-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {quotedText ? (
            <div className="rounded-md border-l-2 border-primary/60 bg-primary/5 px-3 py-2">
              <p className="line-clamp-4 text-xs text-foreground/80">
                &ldquo;{quotedText}&rdquo;
              </p>
            </div>
          ) : null}

          {orphaned ? (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              Text changed on this page. This annotation needs relocation.
            </div>
          ) : null}

          {!canEdit ? (
            <div className="rounded-md border border-border/70 bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
              This annotation was created by another collaborator. You can view
              it, but only the author can edit or delete it.
            </div>
          ) : null}

          <div className="space-y-2 rounded-xl border border-border/60 bg-background/50 p-3">
            <div className="flex items-center gap-2">
              <Avatar size="sm">
                <AvatarImage
                  src={annotation.author?.image ?? undefined}
                  alt={annotation.author?.name ?? "Author"}
                />
                <AvatarFallback>
                  {getInitials(
                    annotation.author?.name,
                    annotation.author?.email
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground">
                  {getDisplayName(
                    annotation.author?.name,
                    annotation.author?.email
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Created {new Date(annotation.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="space-y-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Status
                </span>
                <select
                  value={annotation.status}
                  onChange={(event) =>
                    void handleStatusChange(
                      event.target.value as AnnotationStatus
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  disabled={!canEdit}
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Assignee
                </span>
                <select
                  value={annotation.assignee?.id ?? ""}
                  onChange={(event) =>
                    void handleAssigneeChange(event.target.value)
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  disabled={!canEdit}
                >
                  <option value="">Unassigned</option>
                  {assignableCollaborators.map((collaborator) => (
                    <option key={collaborator.id} value={collaborator.id}>
                      {getDisplayName(collaborator.name, collaborator.email)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {annotation.status.replaceAll("_", " ")}
              </Badge>
              {annotation.assignee ? (
                <Badge variant="secondary">
                  Assigned to{" "}
                  {getDisplayName(
                    annotation.assignee.name,
                    annotation.assignee.email
                  )}
                </Badge>
              ) : (
                <Badge variant="outline">Unassigned</Badge>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Signed in as</span>
                <Badge variant="outline">
                  {currentUser.name || currentUser.email || "You"}
                </Badge>
              </div>
            ) : null}

            {collaborators.length > 0 ? (
              <div className="space-y-1">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Collaborators
                </p>
                <AvatarGroup>
                  {collaborators.slice(0, 5).map((collaborator) => (
                    <Avatar
                      key={collaborator.id}
                      size="sm"
                      title={
                        collaborator.name ||
                        collaborator.email ||
                        "Collaborator"
                      }
                    >
                      <AvatarImage
                        src={collaborator.image ?? undefined}
                        alt={collaborator.name ?? "Collaborator"}
                      />
                      <AvatarFallback>
                        {getInitials(collaborator.name, collaborator.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </AvatarGroup>
              </div>
            ) : null}
          </div>

          {canRelocate ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                startRelocatingAnnotation(annotation.id)
                const tool = ANNOTATION_TYPE_TO_TOOL[annotation.type]
                if (tool) {
                  setTool(tool)
                }
                toast.message(
                  "Select the text again to relocate this annotation."
                )
              }}
            >
              Relocate annotation
            </Button>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Color
            </p>
            <ColorPicker
              value={annotation.color}
              onChange={handleColorChange}
            />
          </div>

          <Separator />

          {/* Annotation Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {contentLabel}
              </p>
              {canEdit && !isEditingDescription && (
                <button
                  type="button"
                  onClick={() => setIsEditingDescription(true)}
                  className="rounded px-1.5 py-0.5 text-[11px] text-primary hover:bg-accent"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditingDescription ? (
              <div className="space-y-2">
                <Textarea
                  value={comment}
                  ref={textareaRef}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={contentPlaceholder}
                  rows={4}
                  className="min-h-[96px] resize-y"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      void triggerCommentSave(comment)
                      setIsEditingDescription(false)
                    }}
                    disabled={!comment.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => {
                      setComment(annotation?.content ?? "")
                      setIsEditingDescription(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : comment ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
                <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                  {comment}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border/40 bg-muted/20 p-2.5">
                <p className="text-xs text-muted-foreground italic">
                  No description yet. Click "Edit" to add one.
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Tags
            </p>
            <TagInput
              tags={annotation.tags}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
              disabled={!canEdit}
            />
          </div>

          <Separator />

          <CommentThread
            annotationId={annotation.id}
            collaborators={collaborators}
          />

          <Separator />

          {canEdit ? (
            <Button
              type="button"
              variant={deleteConfirm ? "destructive" : "outline"}
              size="sm"
              className="w-full gap-1.5"
              onClick={() => void handleDelete()}
            >
              <Trash2 className="size-3.5" />
              {deleteConfirm ? "Click again to confirm" : "Delete annotation"}
            </Button>
          ) : null}

          <p className="text-center text-[10px] text-muted-foreground/60">
            Page {annotation.pageNumber}
          </p>
        </div>
      </ScrollArea>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
