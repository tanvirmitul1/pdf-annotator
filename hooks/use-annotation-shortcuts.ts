"use client"

import { useCallback, useEffect, useRef } from "react"
import { useShortcuts } from "@/hooks/use-shortcuts"
import { useViewer, useViewerStore } from "@/features/viewer/provider"
import type { ToolId } from "@/features/annotations/types"
import { SHORTCUTS } from "@/features/shortcuts/definitions"

/**
 * Registers annotation keyboard shortcuts (V, H, U, S, N, P, R, C, A, X, Delete).
 * Must be used inside a ViewerProvider.
 */
export function useAnnotationShortcuts(
  onDeleteSelected?: () => void,
  onUndo?: () => void,
  onRedo?: () => void
) {
  const setTool = useViewer((s) => s.setTool)
  const store = useViewerStore()
  const previousToolRef = useRef<ToolId | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return
      }

      if (e.key === "Control" || e.key === "Meta") {
        const currentTool = store.getState().activeTool
        if (currentTool !== "select") {
          previousToolRef.current = currentTool
          setTool("select")
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "Control" || e.key === "Meta") {
        if (previousToolRef.current) {
          setTool(previousToolRef.current)
          previousToolRef.current = null
        }
      }
    }

    const handleBlur = () => {
      if (previousToolRef.current) {
        setTool(previousToolRef.current)
        previousToolRef.current = null
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur)
    }
  }, [setTool, store])

  const makeTool = useCallback(
    (t: ToolId) => () => {
      setTool(t)
      previousToolRef.current = null // Reset if manually changed
    },
    [setTool]
  )


  const editingAnnotationId = useViewer((s) => s.editingAnnotationId)
  const isEditing = editingAnnotationId !== null

  useShortcuts(
    [
      { ...SHORTCUTS.TOOL_SELECT, handler: makeTool("select") },
      { ...SHORTCUTS.TOOL_HIGHLIGHT, handler: makeTool("highlight") },
      { ...SHORTCUTS.TOOL_FREEHAND_HIGHLIGHTER, handler: makeTool("freehandHighlight") },
      { ...SHORTCUTS.TOOL_UNDERLINE, handler: makeTool("underline") },
      { ...SHORTCUTS.TOOL_STRIKETHROUGH, handler: makeTool("strikethrough") },
      { ...SHORTCUTS.TOOL_SQUIGGLY, handler: makeTool("squiggly") },
      { ...SHORTCUTS.TOOL_NOTE, handler: makeTool("note") },
      { ...SHORTCUTS.TOOL_PEN, handler: makeTool("freehand") },
      { ...SHORTCUTS.TOOL_RECTANGLE, handler: makeTool("rectangle") },
      { ...SHORTCUTS.TOOL_CIRCLE, handler: makeTool("circle") },
      { ...SHORTCUTS.TOOL_LINE, handler: makeTool("line") },
      { ...SHORTCUTS.TOOL_ARROW, handler: makeTool("arrow") },
      { ...SHORTCUTS.TOOL_TEXTBOX, handler: makeTool("textbox") },
      { ...SHORTCUTS.TOOL_CHECKMARK, handler: makeTool("checkmark") },
      { ...SHORTCUTS.TOOL_CROSSMARK, handler: makeTool("cross") },
      { ...SHORTCUTS.TOOL_SIGNATURE, handler: makeTool("signature") },
      { ...SHORTCUTS.TOOL_IMAGE, handler: makeTool("image") },
      { ...SHORTCUTS.TOOL_REDACT, handler: makeTool("redact") },
      { ...SHORTCUTS.TOOL_ERASER, handler: makeTool("eraser") },
      { ...SHORTCUTS.DELETE_SELECTED, handler: () => onDeleteSelected?.() },
      { ...SHORTCUTS.BACKSPACE_SELECTED, handler: () => onDeleteSelected?.() },
      { ...SHORTCUTS.UNDO, handler: () => onUndo?.() },
      { ...SHORTCUTS.REDO, handler: () => onRedo?.() },
    ],
    !isEditing
  )



}
