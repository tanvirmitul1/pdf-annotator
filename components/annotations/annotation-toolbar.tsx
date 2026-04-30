"use client"

import { useEffect, useState } from "react"
import {
  Check,
  Circle,
  Eraser,
  FileText,
  Hand,
  Highlighter,
  Image as ImageIcon,
  Minus,
  MousePointer2,
  MoveRight,
  Pencil,
  PenTool,
  Square,
  StickyNote,
  Strikethrough,
  Type,
  Underline,
  Waves,
  X,
  ShieldAlert,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
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
import { SignatureDialog } from "./signature-dialog"
import { useAnnotationManager } from "@/features/annotations/use-annotation-manager"

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
  hasColor?: boolean
  hasThickness?: boolean
  desktopOnly?: boolean
  category?: "select" | "text" | "draw" | "shape" | "advanced"
}

const TOOLS: ToolDef[] = [
  {
    id: "select",
    label: "Select",
    shortcut: "V",
    icon: <MousePointer2 className="size-4" />,
    category: "select",
  },
  {
    id: "hand",
    label: "Hand",
    shortcut: "H",
    icon: <Hand className="size-4" />,
    category: "select",
  },
  {
    id: "editText",
    label: "Edit Text (Pro)",
    shortcut: "T",
    icon: <FileText className="size-4" />,
    category: "text",
    desktopOnly: true,
  },
  {
    id: "highlight",
    label: "Highlight",
    shortcut: "Shift+H",
    icon: <Highlighter className="size-4" />,
    hasColor: true,
    category: "text",
  },
  {
    id: "freehandHighlight",
    label: "Freehand highlighter",
    shortcut: "G",
    icon: <Highlighter className="size-4" />,
    hasColor: true,
    hasThickness: true,
    desktopOnly: true,
    category: "draw",
  },
  {
    id: "underline",
    label: "Underline",
    shortcut: "U",
    icon: <Underline className="size-4" />,
    hasColor: true,
    category: "text",
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    shortcut: "S",
    icon: <Strikethrough className="size-4" />,
    hasColor: true,
    category: "text",
  },
  {
    id: "squiggly",
    label: "Squiggly underline",
    shortcut: "Q",
    icon: <Waves className="size-4" />,
    hasColor: true,
    category: "text",
  },
  {
    id: "note",
    label: "Sticky note",
    shortcut: "N",
    icon: <StickyNote className="size-4" />,
    hasColor: true,
    category: "advanced",
  },
  {
    id: "freehand",
    label: "Freehand pen",
    shortcut: "P",
    icon: <Pencil className="size-4" />,
    hasColor: true,
    hasThickness: true,
    desktopOnly: true,
    category: "draw",
  },
  {
    id: "rectangle",
    label: "Rectangle",
    shortcut: "R",
    icon: <Square className="size-4" />,
    hasColor: true,
    hasThickness: true,
    desktopOnly: true,
    category: "shape",
  },
  {
    id: "circle",
    label: "Circle",
    shortcut: "O",
    icon: <Circle className="size-4" />,
    hasColor: true,
    hasThickness: true,
    desktopOnly: true,
    category: "shape",
  },
  {
    id: "checkmark",
    label: "Checkmark",
    shortcut: "K",
    icon: <Check className="size-4" />,
    hasColor: true,
    category: "shape",
  },
  {
    id: "cross",
    label: "Cross",
    shortcut: "Shift+X",
    icon: <X className="size-4" />,
    hasColor: true,
    category: "shape",
  },
  {
    id: "line",
    label: "Line",
    shortcut: "L",
    icon: <Minus className="size-4" />,
    hasColor: true,
    hasThickness: true,
    category: "shape",
  },
  {
    id: "arrow",
    label: "Arrow",
    shortcut: "A",
    icon: <MoveRight className="size-4" />,
    hasColor: true,
    hasThickness: true,
    desktopOnly: true,
    category: "shape",
  },
  {
    id: "textbox",
    label: "Text box",
    shortcut: "X",
    icon: <Type className="size-4" />,
    hasColor: true,
    desktopOnly: true,
    category: "text",
  },
  {
    id: "signature",
    label: "Signature",
    shortcut: "I",
    icon: <PenTool className="size-4" />,
    hasColor: true,
    category: "advanced",
  },
  {
    id: "redact",
    label: "Redact",
    shortcut: "D",
    icon: <ShieldAlert className="size-4" />,
    category: "advanced",
  },
  {
    id: "image",
    label: "Image",
    shortcut: "M",
    icon: <ImageIcon className="size-4" />,
    category: "advanced",
  },
  {
    id: "eraser",
    label: "Eraser",
    shortcut: "E",
    icon: <Eraser className="size-4" />,
    hasThickness: true,
    category: "draw",
  },
]

export function AnnotationToolbar() {
  const activeTool = useViewer((state) => state.activeTool)
  const setTool = useViewer((state) => state.setTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const setSelectedColor = useViewer((state) => state.setSelectedColor)
  const toolThickness = useViewer((state) => state.toolThickness)
  const setToolThickness = useViewer((state) => state.setToolThickness)
  const discardDraft = useViewer((state) => state.discardDraft)
  const isAuthenticated = useViewer((state) => state.isAuthenticated)
  const onAnnotationAttempt = useViewer((state) => state.onAnnotationAttempt)
  const documentId = useViewer((state) => state.documentId)
  const pageNumber = useViewer((state) => state.currentPage)

  const { addAnnotation } = useAnnotationManager(documentId)

  const [coarsePointer, setCoarsePointer] = useState(false)
  const [signatureOpen, setSignatureOpen] = useState(false)

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
  const showThicknessControl = Boolean(
    activeToolDef?.hasThickness && activeTool !== "select"
  )

  // Group tools by category for visual organization
  const toolsByCategory = TOOLS.reduce((acc, tool) => {
    const cat = tool.category || "select"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(tool)
    return acc
  }, {} as Record<string, ToolDef[]>)

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/40 bg-card/80 px-1.5 py-3 shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:bg-card/95"
        role="toolbar"
        aria-label="Annotation tools"
      >
        {Object.entries(toolsByCategory).map(([category, tools], catIndex) => (
          <div key={category} className="flex flex-col items-center gap-1">
            {catIndex > 0 && <Separator className="my-1 w-6 opacity-40" />}
            {tools.map((tool) => {
              const isActive = activeTool === tool.id

              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        if (tool.id !== "select" && tool.id !== "eraser" && tool.id !== "hand") {
                          if (!isAuthenticated && onAnnotationAttempt) {
                            const allowed = onAnnotationAttempt()
                            if (!allowed) return
                          }
                        }
                        if (
                          coarsePointer &&
                          tool.desktopOnly
                        ) {
                          toast.message("This tool is available on desktop.")
                          return
                        }
                        if (tool.id === "signature") {
                          setSignatureOpen(true)
                          return
                        }
                        if (tool.id === "image") {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = "image/*"
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (re) => {
                                const url = re.target?.result as string
                                if (url) {
                                  addAnnotation({
                                    documentId,
                                    pageNumber,
                                    type: "IMAGE_SHAPE",
                                    color: "#000000",
                                    positionData: {
                                      kind: "IMAGE",
                                      pageNumber,
                                      x: 50,
                                      y: 100,
                                      width: 200,
                                      height: 150,
                                      url,
                                    },
                                  })
                                }
                              }
                              reader.readAsDataURL(file)
                            }
                          }
                          input.click()
                          return
                        }
                        setTool(tool.id)
                      }}
                      aria-pressed={isActive}
                      aria-label={`${tool.label} (${tool.shortcut})`}
                      className={cn(
                        "relative flex size-9 items-center justify-center rounded-xl transition-all duration-200",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                      )}
                    >
                      {tool.icon}
                      {isActive && (
                        <motion.div
                          layoutId="activeTool"
                          className="absolute inset-0 z-[-1] rounded-xl bg-primary"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex items-center gap-2 px-3 py-1.5 text-xs">
                    <span className="font-semibold">{tool.label}</span>
                    <kbd className="inline-flex h-5 items-center rounded border border-border bg-muted px-1.5 font-sans text-[10px] font-medium text-muted-foreground">
                      {tool.shortcut}
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}

        <AnimatePresence>
          {(showColorPicker || showThicknessControl) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex flex-col items-center overflow-hidden"
            >
              <Separator className="my-2 w-6 opacity-40" />
              
              {showColorPicker && (
                <div className="flex flex-col gap-2 py-1">
                  <ColorPicker
                    value={selectedColor}
                    onChange={setSelectedColor}
                    size="sm"
                    className="flex-col gap-1.5"
                  />
                </div>
              )}

              {showThicknessControl && (
                <div className="flex flex-col items-center gap-2 pb-1 pt-3">
                   <div className="relative h-28 w-1.5 overflow-hidden rounded-full bg-accent/30">
                    <input
                      id="annotation-thickness"
                      type="range"
                      min={activeTool === "eraser" ? 8 : 2}
                      max={activeTool === "freehandHighlight" ? 28 : activeTool === "eraser" ? 32 : 12}
                      step={1}
                      value={toolThickness}
                      onChange={(event) => setToolThickness(Number(event.target.value))}
                      className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 [writing-mode:bt-lr]"
                      style={{ transform: 'rotate(-90deg)' }}
                    />
                    <motion.div 
                      className="absolute bottom-0 left-0 w-full bg-primary"
                      animate={{ height: `${((toolThickness - (activeTool === "eraser" ? 8 : 2)) / ((activeTool === "freehandHighlight" ? 28 : activeTool === "eraser" ? 32 : 12) - (activeTool === "eraser" ? 8 : 2))) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold tabular-nums text-primary">
                    {toolThickness}
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <SignatureDialog
          open={signatureOpen}
          onOpenChange={setSignatureOpen}
          onSave={(data) => {
            addAnnotation({
              documentId,
              pageNumber,
              type: "SIGNATURE",
              color: selectedColor,
              positionData: {
                kind: "SIGNATURE",
                pageNumber,
                x: 50,
                y: 100,
                width: 200,
                height: 100,
                data,
              },
            })
          }}
        />
      </motion.div>
    </TooltipProvider>
  )
}
