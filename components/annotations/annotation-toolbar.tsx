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
import { motion } from "framer-motion"
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

import { SignatureDialog } from "./signature-dialog"
import { useAnnotationManager } from "@/features/annotations/use-annotation-manager"
import { useDocumentEditor } from "@/features/viewer/hooks/use-document-editor"

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
  const { isEditMode, setEditMode } = useDocumentEditor()
  const activeTool = useViewer((state) => state.activeTool)
  const setTool = useViewer((state) => state.setTool)
  const selectedColor = useViewer((state) => state.selectedColor)
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
        layout
        className="flex h-10 items-center gap-1.5 rounded-xl border border-border/20 bg-muted/40 p-1 backdrop-blur-md"
        role="toolbar"
        aria-label="Annotation tools"
      >
        {/* Deep Edit Mode Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setEditMode(!isEditMode)}
              className={cn(
                "group relative flex h-8 w-10 items-center justify-center rounded-lg transition-all duration-300",
                isEditMode 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              {isEditMode ? <ShieldAlert className="size-4" /> : <MousePointer2 className="size-4" />}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="flex items-center gap-2">
            <span className="font-bold text-xs">Deep Edit</span>
          </TooltipContent>
        </Tooltip>

        <Separator orientation="vertical" className="mx-0.5 h-6 opacity-30" />

        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
          {Object.entries(toolsByCategory).map(([category, tools], catIndex) => (
            <div key={category} className="flex items-center gap-0.5">
              {catIndex > 0 && <Separator orientation="vertical" className="mx-1 h-5 opacity-20" />}
              {tools.map((tool) => {
                const isActive = activeTool === tool.id

                return (
                  <Tooltip key={tool.id}>
                    <TooltipTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => {
                          if (tool.id !== "select" && tool.id !== "eraser" && tool.id !== "hand") {
                            if (!isAuthenticated && onAnnotationAttempt) {
                              const allowed = onAnnotationAttempt()
                              if (!allowed) return
                            }
                          }
                          if (coarsePointer && tool.desktopOnly) {
                            toast.message("Desktop only tool.")
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
                          "group relative flex h-8 w-9 items-center justify-center rounded-lg transition-all duration-300",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <div className="size-4">
                          {tool.icon}
                        </div>
                      </motion.button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={8} className="flex items-center gap-3 border-border/40 bg-card/95 px-3 py-2 text-xs text-popover-foreground backdrop-blur-2xl shadow-2xl ring-1 ring-border/20">
                      <span className="font-bold tracking-tight">{tool.label}</span>
                      <kbd className="inline-flex h-5 items-center rounded-md border border-border bg-muted/80 px-2 font-mono text-[10px] font-black text-muted-foreground shadow-sm">
                        {tool.shortcut}
                      </kbd>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>


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

