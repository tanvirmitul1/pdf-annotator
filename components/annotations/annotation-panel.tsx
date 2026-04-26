"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import {
  useAddTagMutation,
  useCreateAnnotationMutation,
  useDeleteAnnotationMutation,
  useListByDocumentQuery,
  useRemoveTagMutation,
  useUpdateAnnotationMutation,
} from "@/features/annotations/api"
import type { AnnotationType, ToolId } from "@/features/annotations/types"
import { useViewer } from "@/features/viewer/provider"
import { useDebouncedMutation } from "@/hooks/use-debounced-mutation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"

import { ColorPicker } from "./color-picker"
import { TagInput } from "./tag-input"

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
  const orphanedAnnotationIds = useViewer((state) => state.orphanedAnnotationIds)
  const startRelocatingAnnotation = useViewer(
    (state) => state.startRelocatingAnnotation
  )
  const setTool = useViewer((state) => state.setTool)

  const { data: annotations = [] } = useListByDocumentQuery(documentId)
  const annotation = annotations.find((item) => item.id === annotationId)

  const [comment, setComment] = useState(annotation?.content ?? "")
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const deleteConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

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
    if (!annotationId || typeof window === "undefined" || !window.matchMedia("(pointer: coarse)").matches) {
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
      if (!annotation) {
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
    [annotation, documentId, pushUndo, setSaveStatus, updateAnnotation]
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
    if (!annotation || color === annotation.color) {
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
    if (!annotation) {
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
    if (!annotation) {
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
    if (!annotation) {
      return
    }

    const recreated = await createAnnotation({
      documentId,
      pageNumber: annotation.pageNumber,
      type: annotation.type,
      color: annotation.color,
      positionData: annotation.positionData,
      ...(annotation.content ? { content: annotation.content } : {}),
    }).unwrap()

    pushUndo({ action: "create", before: null, after: recreated })
  }

  async function handleDelete() {
    if (!annotation) {
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

  if (!annotation) {
    return null
  }

  const orphaned = Boolean(orphanedAnnotationIds[annotation.id])
  const canRelocate = orphaned && annotation.positionData.kind === "TEXT"

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
          className="ml-auto flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                toast.message("Select the text again to relocate this annotation.")
              }}
            >
              Relocate annotation
            </Button>
          ) : null}

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Color</p>
            <ColorPicker value={annotation.color} onChange={handleColorChange} />
          </div>

          <Separator />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">
              Comment
            </p>
            <Textarea
              value={comment}
              onChange={(event) => {
                const nextValue = event.target.value
                setComment(nextValue)
                debouncedSave(nextValue)
              }}
              onBlur={() => flushSave()}
              placeholder="Add a comment..."
              aria-label="Annotation comment"
              rows={4}
              className="min-h-[96px] resize-y"
            />
          </div>

          <Separator />

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Tags</p>
            <TagInput
              tags={annotation.tags}
              onAdd={handleAddTag}
              onRemove={handleRemoveTag}
            />
          </div>

          <Separator />

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
