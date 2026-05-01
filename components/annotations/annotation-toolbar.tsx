"use client"

import { useEffect, useState } from "react"
import {
  Check,
  Circle,
  Eraser,
  FileText,
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

interface ToolDef {
  id: ToolId
  label: string
  shortcut: string
  icon: React.ReactNode
  hasColor?: boolean
  hasThickness?: boolean
  desktopOnly?: boolean
  group: number // visual group separator
}

// Organized like Google Docs / MS Word annotation toolbar:
// Group 0: cursor tools
// Group 1: text markup (highlight, underline, strikethrough, squiggly)
// Group 2: text annotations (textbox, note)
// Group 3: drawing tools (pen, shapes)
// Group 4: stamps and special
const TOOLS: ToolDef[] = [
  // ── Cursor tools
  { id: "select",          label: "Select",          shortcut: "V",       icon: <MousePointer2 className="size-4" />, group: 0 },
  { id: "editText",        label: "Edit PDF Text",   shortcut: "Shift+T", icon: <FileText className="size-4" />,      group: 0, desktopOnly: true },
  // ── Text markup (like Word's Review toolbar)
  { id: "highlight",       label: "Highlight",       shortcut: "H",       icon: <Highlighter className="size-4" />,   hasColor: true, group: 1 },
  { id: "underline",       label: "Underline",       shortcut: "U",       icon: <Underline className="size-4" />,     hasColor: true, group: 1 },
  { id: "strikethrough",   label: "Strikethrough",   shortcut: "S",       icon: <Strikethrough className="size-4" />, hasColor: true, group: 1 },
  { id: "squiggly",        label: "Squiggly",        shortcut: "Q",       icon: <Waves className="size-4" />,         hasColor: true, group: 1 },
  // ── Text annotations
  { id: "textbox",         label: "Add Text",        shortcut: "T",       icon: <Type className="size-4" />,          hasColor: true, group: 2 },
  { id: "note",            label: "Comment",         shortcut: "N",       icon: <StickyNote className="size-4" />,    hasColor: true, group: 2 },
  // ── Drawing tools
  { id: "freehand",        label: "Draw",            shortcut: "P",       icon: <Pencil className="size-4" />,        hasColor: true, hasThickness: true, desktopOnly: true, group: 3 },
  { id: "freehandHighlight", label: "Marker",       shortcut: "G",       icon: <Highlighter className="size-4" />,   hasColor: true, hasThickness: true, desktopOnly: true, group: 3 },
  // ── Shapes
  { id: "rectangle",       label: "Rectangle",       shortcut: "R",       icon: <Square className="size-4" />,        hasColor: true, hasThickness: true, desktopOnly: true, group: 4 },
  { id: "circle",          label: "Circle",          shortcut: "O",       icon: <Circle className="size-4" />,        hasColor: true, hasThickness: true, desktopOnly: true, group: 4 },
  { id: "line",            label: "Line",            shortcut: "L",       icon: <Minus className="size-4" />,         hasColor: true, hasThickness: true, group: 4 },
  { id: "arrow",           label: "Arrow",           shortcut: "A",       icon: <MoveRight className="size-4" />,     hasColor: true, hasThickness: true, desktopOnly: true, group: 4 },
  // ── Stamps / special
  { id: "checkmark",       label: "Checkmark",       shortcut: "K",       icon: <Check className="size-4" />,         hasColor: true, group: 5 },
  { id: "cross",           label: "Cross mark",      shortcut: "X",       icon: <X className="size-4" />,             hasColor: true, group: 5 },
  { id: "signature",       label: "Signature",       shortcut: "I",       icon: <PenTool className="size-4" />,       hasColor: true, group: 5 },
  { id: "image",           label: "Insert Image",    shortcut: "M",       icon: <ImageIcon className="size-4" />,     group: 5 },
  { id: "redact",          label: "Redact",          shortcut: "D",       icon: <ShieldAlert className="size-4" />,   group: 5 },
  // ── Eraser always last
  { id: "eraser",          label: "Eraser",          shortcut: "E",       icon: <Eraser className="size-4" />,        hasThickness: true, group: 6 },
]

export function AnnotationToolbar() {
  const activeTool = useViewer((state) => state.activeTool)
  const setTool = useViewer((state) => state.setTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const isAuthenticated = useViewer((state) => state.isAuthenticated)
  const onAnnotationAttempt = useViewer((state) => state.onAnnotationAttempt)
  const documentId = useViewer((state) => state.documentId)
  const pageNumber = useViewer((state) => state.currentPage)

  const { addAnnotation } = useAnnotationManager(documentId)

  const [coarsePointer, setCoarsePointer] = useState(false)
  const [signatureOpen, setSignatureOpen] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(pointer: coarse)")
    const update = () => setCoarsePointer(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  // Build groups for rendering separators
  const groups: ToolDef[][] = []
  let currentGroup = -1
  for (const tool of TOOLS) {
    if (tool.group !== currentGroup) {
      groups.push([])
      currentGroup = tool.group
    }
    groups[groups.length - 1].push(tool)
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-0.5 rounded-xl border border-border/50 bg-card/90 px-2 py-1 shadow-lg backdrop-blur-xl overflow-x-auto w-full max-w-max no-scrollbar"
        role="toolbar"
        aria-label="Annotation tools"
      >
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && <Separator orientation="vertical" className="mx-1 h-5 opacity-20" />}
            {group.map((tool) => {
              const isActive = activeTool === tool.id
              return (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        // Auth gate for annotation tools
                        if (tool.id !== "select" && tool.id !== "eraser") {
                          if (!isAuthenticated && onAnnotationAttempt) {
                            const allowed = onAnnotationAttempt()
                            if (!allowed) return
                          }
                        }
                        // Desktop-only guard
                        if (coarsePointer && tool.desktopOnly) {
                          toast.message("This tool works best on desktop.")
                          return
                        }
                        // Signature: open dialog
                        if (tool.id === "signature") {
                          setSignatureOpen(true)
                          return
                        }
                        // Image: open file picker
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
                        "group relative flex h-8 w-9 items-center justify-center rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <div className="size-4">{tool.icon}</div>
                      {/* Active color dot indicator */}
                      {isActive && tool.hasColor && (
                        <div
                          className="absolute bottom-0.5 right-0.5 size-1.5 rounded-full border border-primary-foreground/40"
                          style={{ backgroundColor: selectedColor }}
                        />
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    sideOffset={8}
                    className="flex items-center gap-3 border-border/40 bg-card/95 px-3 py-2 text-xs text-popover-foreground backdrop-blur-2xl shadow-2xl ring-1 ring-border/20"
                  >
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
      </motion.div>

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
    </TooltipProvider>
  )
}
