"use client"

import { useEffect, useState, useRef } from "react"
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
  ChevronDown,
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
}

interface ToolGroupDef {
  id: string
  icon?: React.ReactNode // Default icon if none selected
  items: ToolDef[]
}

const TOOL_GROUPS: ToolGroupDef[] = [
  {
    id: "select",
    items: [{ id: "select", label: "Select", shortcut: "V", icon: <MousePointer2 className="size-4" /> }],
  },
  {
    id: "edit",
    items: [{ id: "editText", label: "Edit PDF Text", shortcut: "Shift+T", icon: <FileText className="size-4" />, desktopOnly: true }],
  },
  {
    id: "draw",
    icon: <Pencil className="size-4" />,
    items: [
      { id: "freehand", label: "Draw", shortcut: "P", icon: <Pencil className="size-4" />, hasColor: true, hasThickness: true, desktopOnly: true },
      { id: "freehandHighlight", label: "Marker", shortcut: "G", icon: <Highlighter className="size-4" />, hasColor: true, hasThickness: true, desktopOnly: true },
      { id: "highlight", label: "Highlight Text", shortcut: "H", icon: <Highlighter className="size-4 text-yellow-500" />, hasColor: true },
    ],
  },
  {
    id: "text",
    icon: <Type className="size-4" />,
    items: [
      { id: "textbox", label: "Add Text", shortcut: "T", icon: <Type className="size-4" />, hasColor: true },
      { id: "note", label: "Comment", shortcut: "N", icon: <StickyNote className="size-4" />, hasColor: true },
      { id: "underline", label: "Underline", shortcut: "U", icon: <Underline className="size-4" />, hasColor: true },
      { id: "strikethrough", label: "Strikethrough", shortcut: "S", icon: <Strikethrough className="size-4" />, hasColor: true },
      { id: "squiggly", label: "Squiggly", shortcut: "Q", icon: <Waves className="size-4" />, hasColor: true },
    ],
  },
  {
    id: "shapes",
    icon: <Square className="size-4" />,
    items: [
      { id: "rectangle", label: "Rectangle", shortcut: "R", icon: <Square className="size-4" />, hasColor: true, hasThickness: true, desktopOnly: true },
      { id: "circle", label: "Circle", shortcut: "O", icon: <Circle className="size-4" />, hasColor: true, hasThickness: true, desktopOnly: true },
      { id: "line", label: "Line", shortcut: "L", icon: <Minus className="size-4" />, hasColor: true, hasThickness: true },
      { id: "arrow", label: "Arrow", shortcut: "A", icon: <MoveRight className="size-4" />, hasColor: true, hasThickness: true, desktopOnly: true },
    ],
  },
  {
    id: "media",
    items: [{ id: "image", label: "Insert Image", shortcut: "M", icon: <ImageIcon className="size-4" /> }],
  },
  {
    id: "stamps",
    icon: <Check className="size-4" />,
    items: [
      { id: "checkmark", label: "Checkmark", shortcut: "K", icon: <Check className="size-4" />, hasColor: true },
      { id: "cross", label: "Cross mark", shortcut: "X", icon: <X className="size-4" />, hasColor: true },
      { id: "signature", label: "Signature", shortcut: "I", icon: <PenTool className="size-4" />, hasColor: true },
      { id: "redact", label: "Redact", shortcut: "D", icon: <ShieldAlert className="size-4" /> },
    ],
  },
  {
    id: "eraser",
    items: [{ id: "eraser", label: "Eraser", shortcut: "E", icon: <Eraser className="size-4" />, hasThickness: true }],
  },
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

  const handleToolClick = (tool: ToolDef) => {
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
    
    // Toggle off if already active
    if (activeTool === tool.id) {
      setTool("select")
    } else {
      setTool(tool.id)
    }
  }

  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (groupId: string) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current)
    setOpenGroup(groupId)
  }

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setOpenGroup(null)
    }, 150) // Small delay to allow moving mouse into dropdown
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="flex items-center gap-1 rounded-xl border border-border/50 bg-card/90 px-2 py-1 shadow-lg backdrop-blur-xl overflow-visible w-max"
        role="toolbar"
        aria-label="Annotation tools"
      >
        {TOOL_GROUPS.map((group, gi) => {
          const isGroupActive = group.items.some(t => t.id === activeTool)
          const activeToolInGroup = group.items.find(t => t.id === activeTool)
          const isDropdown = group.items.length > 1
          
          const displayTool = activeToolInGroup || group.items[0]
          const isOpen = openGroup === group.id
          
          return (
            <div key={group.id} className="flex items-center gap-1">
              {gi > 0 && <Separator orientation="vertical" className="mx-1 h-5 opacity-20" />}
              
              <div 
                className="relative"
                onMouseEnter={() => isDropdown && handleMouseEnter(group.id)}
                onMouseLeave={() => isDropdown && handleMouseLeave()}
              >
                {(() => {
                  const buttonElement = (
                    <motion.button
                      whileHover={{ scale: 1.05, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => {
                        if (isDropdown) {
                           setOpenGroup(isOpen ? null : group.id)
                        } else {
                           handleToolClick(displayTool)
                        }
                      }}
                      aria-pressed={isGroupActive}
                      aria-label={`${displayTool.label} (${displayTool.shortcut})`}
                      className={cn(
                        "flex h-8 items-center justify-center rounded-lg transition-all duration-200 z-10 relative",
                        isDropdown ? "px-1.5 w-auto gap-1" : "w-9",
                        isGroupActive || isOpen
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      )}
                    >
                      <div className="size-4">{displayTool.icon}</div>
                      
                      {isDropdown && (
                        <ChevronDown className={cn("size-3 transition-transform", isOpen ? "rotate-180 opacity-100" : "opacity-50")} />
                      )}
                      
                      {isGroupActive && displayTool.hasColor && (
                        <div
                          className="absolute bottom-0.5 right-0.5 size-1.5 rounded-full border border-primary-foreground/40"
                          style={{ backgroundColor: selectedColor }}
                        />
                      )}
                    </motion.button>
                  )

                  if (isDropdown) {
                    return buttonElement
                  }

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {buttonElement}
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={8} className="flex items-center gap-3">
                        <span className="font-bold tracking-tight">{displayTool.label}</span>
                        <kbd className="inline-flex h-5 items-center rounded-md border border-border bg-muted/80 px-2 font-mono text-[10px] font-black text-muted-foreground shadow-sm">
                          {displayTool.shortcut}
                        </kbd>
                      </TooltipContent>
                    </Tooltip>
                  )
                })()}

                {/* Dropdown menu */}
                <AnimatePresence>
                  {isDropdown && isOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 top-full z-[100] pt-2"
                    >
                      <div className="flex flex-col gap-1 rounded-xl border border-border/50 bg-card/95 p-1.5 shadow-xl backdrop-blur-xl">
                        {group.items.map(tool => (
                          <Tooltip key={tool.id}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleToolClick(tool)
                                  setOpenGroup(null)
                                }}
                                className={cn(
                                  "flex items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors w-full text-left",
                                  activeTool === tool.id 
                                    ? "bg-primary/10 text-primary font-medium" 
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                              >
                                <div className="size-4 shrink-0">{tool.icon}</div>
                                <span className="flex-1 whitespace-nowrap">{tool.label}</span>
                                <kbd className="text-[10px] font-mono tracking-tighter opacity-50">{tool.shortcut}</kbd>
                              </button>
                            </TooltipTrigger>
                          </Tooltip>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )
        })}
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
