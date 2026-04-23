"use client"

import { useEffect, useState } from "react"
import {
  Circle,
  Eraser,
  Highlighter,
  MousePointer2,
  MoveRight,
  Pencil,
  Square,
  StickyNote,
  Strikethrough,
  Type,
  Underline,
  Waves,
} from "lucide-react"
import { toast } from "sonner"

import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useViewer } from "@/features/viewer/provider"
import type { ToolId } from "@/features/annotations/types"
import { cn } from "@/lib/utils"

import { ColorPicker } from "./color-picker"

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
  hasColor?: boolean
  desktopOnly?: boolean
}

const TOOLS: ToolDef[] = [
  {
    id: "select",
    label: "Select",
    shortcut: "V",
    icon: <MousePointer2 className="size-4" />,
  },
  {
    id: "highlight",
    label: "Highlight",
    shortcut: "H",
    icon: <Highlighter className="size-4" />,
    hasColor: true,
  },
  {
    id: "underline",
    label: "Underline",
    shortcut: "U",
    icon: <Underline className="size-4" />,
    hasColor: true,
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    shortcut: "S",
    icon: <Strikethrough className="size-4" />,
    hasColor: true,
  },
  {
    id: "squiggly",
    label: "Squiggly underline",
    shortcut: "Q",
    icon: <Waves className="size-4" />,
    hasColor: true,
  },
  {
    id: "note",
    label: "Sticky note",
    shortcut: "N",
    icon: <StickyNote className="size-4" />,
    hasColor: true,
  },
  {
    id: "freehand",
    label: "Freehand pen",
    shortcut: "P",
    icon: <Pencil className="size-4" />,
    hasColor: true,
    desktopOnly: true,
  },
  {
    id: "rectangle",
    label: "Rectangle",
    shortcut: "R",
    icon: <Square className="size-4" />,
    hasColor: true,
    desktopOnly: true,
  },
  {
    id: "circle",
    label: "Circle",
    shortcut: "C",
    icon: <Circle className="size-4" />,
    hasColor: true,
    desktopOnly: true,
  },
  {
    id: "arrow",
    label: "Arrow",
    shortcut: "A",
    icon: <MoveRight className="size-4" />,
    hasColor: true,
    desktopOnly: true,
  },
  {
    id: "textbox",
    label: "Text box",
    shortcut: "X",
    icon: <Type className="size-4" />,
    desktopOnly: true,
  },
  {
    id: "eraser",
    label: "Eraser",
    shortcut: "E",
    icon: <Eraser className="size-4" />,
  },
]

export function AnnotationToolbar() {
  const activeTool = useViewer((state) => state.activeTool)
  const setTool = useViewer((state) => state.setTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const setSelectedColor = useViewer((state) => state.setSelectedColor)
  const discardDraft = useViewer((state) => state.discardDraft)
  const isAuthenticated = useViewer((state) => state.isAuthenticated)
  const onAnnotationAttempt = useViewer((state) => state.onAnnotationAttempt)
  const [coarsePointer, setCoarsePointer] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return
    }

    const media = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarsePointer(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        Boolean(target?.isContentEditable)

      if (event.key === "Escape" && !isEditable) {
        setTool("select")
        discardDraft()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [discardDraft, setTool])

  const activeToolDef = TOOLS.find((tool) => tool.id === activeTool)
  const showColorPicker =
    activeToolDef?.hasColor && activeTool !== "select" && activeTool !== "eraser"

  return (
    <TooltipProvider delayDuration={400}>
      <div
        className="flex flex-col items-center gap-1 rounded-xl border border-border/60 bg-card/90 px-1 py-2 shadow-lg backdrop-blur-xl"
        role="toolbar"
        aria-label="Annotation tools"
      >
        {TOOLS.map((tool, index) => {
          const isActive = activeTool === tool.id
          const showSeparator = index === 1 || index === 6 || index === 11

          return (
            <div key={tool.id} className="flex flex-col items-center gap-1">
              {showSeparator ? <Separator className="my-0.5 w-6" /> : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      if (tool.id !== "select" && tool.id !== "eraser") {
                        if (!isAuthenticated && onAnnotationAttempt) {
                          const allowed = onAnnotationAttempt()
                          if (!allowed) return
                        }
                      }
                      if (
                        coarsePointer &&
                        (tool.id === "freehand" ||
                          tool.id === "rectangle" ||
                          tool.id === "circle" ||
                          tool.id === "arrow")
                      ) {
                        toast.message("Freehand and shape tools are available on desktop.")
                        return
                      }
                      setTool(tool.id)
                    }}
                    aria-pressed={isActive}
                    aria-label={`${tool.label} (${tool.shortcut})`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg transition-colors duration-100",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    {tool.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">
                  <span className="font-medium">{tool.label}</span>
                  <span className="ml-1.5 opacity-60">({tool.shortcut})</span>
                  {tool.desktopOnly ? (
                    <span className="ml-1 text-muted-foreground">Desktop</span>
                  ) : null}
                </TooltipContent>
              </Tooltip>
            </div>
          )
        })}

        {showColorPicker ? (
          <>
            <Separator className="my-0.5 w-6" />
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              size="sm"
              className="flex-col gap-1.5"
            />
          </>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
