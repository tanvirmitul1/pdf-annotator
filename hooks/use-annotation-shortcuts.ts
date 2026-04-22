"use client"

import { useCallback } from "react"
import { useShortcuts } from "@/hooks/use-shortcuts"
import { useViewer } from "@/features/viewer/provider"
import type { ToolId } from "@/features/annotations/types"

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

  const makeTool = useCallback(
    (t: ToolId) => () => setTool(t),
    [setTool]
  )

  useShortcuts([
    {
      key: "v",
      label: "V",
      category: "Annotation",
      description: "Select tool",
      handler: makeTool("select"),
    },
    {
      key: "h",
      label: "H",
      category: "Annotation",
      description: "Highlight",
      handler: makeTool("highlight"),
    },
    {
      key: "u",
      label: "U",
      category: "Annotation",
      description: "Underline",
      handler: makeTool("underline"),
    },
    {
      key: "s",
      label: "S",
      category: "Annotation",
      description: "Strikethrough",
      handler: makeTool("strikethrough"),
    },
    {
      key: "n",
      label: "N",
      category: "Annotation",
      description: "Sticky note",
      handler: makeTool("note"),
    },
    {
      key: "p",
      label: "P",
      category: "Annotation",
      description: "Freehand pen",
      handler: makeTool("freehand"),
    },
    {
      key: "r",
      label: "R",
      category: "Annotation",
      description: "Rectangle",
      handler: makeTool("rectangle"),
    },
    {
      key: "c",
      label: "C",
      category: "Annotation",
      description: "Circle",
      handler: makeTool("circle"),
    },
    {
      key: "a",
      label: "A",
      category: "Annotation",
      description: "Arrow",
      handler: makeTool("arrow"),
    },
    {
      key: "x",
      label: "X",
      category: "Annotation",
      description: "Text box",
      handler: makeTool("textbox"),
    },
    {
      key: "delete",
      label: "Delete",
      category: "Annotation",
      description: "Delete selected annotation",
      handler: () => onDeleteSelected?.(),
    },
    {
      key: "ctrl+z",
      label: "Ctrl+Z",
      category: "Annotation",
      description: "Undo",
      handler: () => onUndo?.(),
    },
    {
      key: "ctrl+shift+z",
      label: "Ctrl+Shift+Z",
      category: "Annotation",
      description: "Redo",
      handler: () => onRedo?.(),
    },
  ])
}
