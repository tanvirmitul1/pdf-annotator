"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlignCenter, AlignLeft, AlignRight } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"
import { ColorPicker } from "./color-picker"

const FONTS = [
  { name: "Inter", value: "font-sans" },
  { name: "Serif", value: "font-serif" },
  { name: "Mono", value: "font-mono" },
]

const FONT_SIZES = [
  { label: "S", value: 12 },
  { label: "M", value: 16 },
  { label: "L", value: 20 },
  { label: "XL", value: 24 },
]

export function SecondaryToolbar() {
  const activeTool = useViewer((state) => state.activeTool)
  const selectedColor = useViewer((state) => state.selectedColor)
  const setSelectedColor = useViewer((state) => state.setSelectedColor)
  const toolThickness = useViewer((state) => state.toolThickness)
  const setToolThickness = useViewer((state) => state.setToolThickness)
  
  const activeFont = useViewer((state) => state.activeFont)
  const setFont = useViewer((state) => state.setFont)
  const activeFontSize = useViewer((state) => state.activeFontSize)
  const setFontSize = useViewer((state) => state.setFontSize)
  const activeAlign = useViewer((state) => state.activeAlign)
  const setAlign = useViewer((state) => state.setAlign)

  const hasColor = ["highlight", "freehandHighlight", "underline", "strikethrough", "squiggly", "note", "freehand", "rectangle", "circle", "checkmark", "cross", "line", "arrow", "textbox", "signature"].includes(activeTool)
  const hasThickness = ["freehandHighlight", "freehand", "rectangle", "circle", "line", "arrow", "eraser"].includes(activeTool)
  const hasTextOptions = ["textbox", "editText"].includes(activeTool)

  if (activeTool === "select" || activeTool === "hand") return null

  return (
    <TooltipProvider delayDuration={400}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTool}
          initial={{ y: -20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="flex h-12 max-w-[calc(100vw-2rem)] items-center gap-2 overflow-x-auto no-scrollbar rounded-full border border-border/40 bg-card/60 px-3 md:px-4 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.3)] backdrop-blur-3xl ring-1 ring-border/20"
        >
          {hasColor && (
            <div className="flex items-center gap-2 md:gap-3">
              <ColorPicker
                value={selectedColor}
                onChange={setSelectedColor}
                size="sm"
              />
              <Separator orientation="vertical" className="h-5 opacity-40" />
            </div>
          )}

          {hasThickness && (
            <div className="flex items-center gap-2 md:gap-3 px-1 shrink-0">
              <div className="flex items-center gap-2 md:gap-3">
                 <span className="hidden md:block text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] opacity-70">Thickness</span>
                 <div className="group relative flex items-center">
                    <input
                      type="range"
                      min={activeTool === "eraser" ? 8 : 2}
                      max={activeTool === "freehandHighlight" ? 40 : activeTool === "eraser" ? 64 : 20}
                      value={toolThickness}
                      onChange={(e) => setToolThickness(Number(e.target.value))}
                      className="w-24 h-1 bg-primary/10 rounded-full appearance-none cursor-pointer accent-primary transition-all group-hover:bg-primary/20"
                    />
                 </div>
                 <span className="text-[10px] font-mono font-bold tabular-nums w-5 text-primary/80 text-center">{toolThickness}</span>
              </div>
              <Separator orientation="vertical" className="h-5 opacity-40" />
            </div>
          )}

          {hasTextOptions && (
            <div className="flex items-center gap-3">
              {/* Font Family */}
              <div className="flex items-center gap-1 bg-accent/20 p-1 rounded-lg">
                {FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setFont?.(font.value)}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all duration-200",
                      activeFont === font.value 
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
              
              {/* Font Size */}
              <div className="flex items-center gap-1 bg-accent/20 p-1 rounded-lg">
                {FONT_SIZES.map((size) => (
                  <button
                    key={size.value}
                    onClick={() => setFontSize?.(size.value)}
                    className={cn(
                      "size-7 flex items-center justify-center text-[10px] font-bold rounded-md transition-all duration-200",
                      activeFontSize === size.value 
                        ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {size.label}
                  </button>
                ))}
              </div>

              {/* Alignment */}
              <div className="flex items-center gap-1 bg-accent/20 p-1 rounded-lg">
                <button 
                  onClick={() => setAlign?.("left")}
                  className={cn("p-1.5 rounded-md transition-all", activeAlign === "left" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground")}
                >
                  <AlignLeft className="size-3.5" />
                </button>
                <button 
                  onClick={() => setAlign?.("center")}
                  className={cn("p-1.5 rounded-md transition-all", activeAlign === "center" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground")}
                >
                  <AlignCenter className="size-3.5" />
                </button>
                <button 
                  onClick={() => setAlign?.("right")}
                  className={cn("p-1.5 rounded-md transition-all", activeAlign === "right" ? "bg-background text-foreground shadow-sm ring-1 ring-border/50" : "text-muted-foreground hover:text-foreground")}
                >
                  <AlignRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </TooltipProvider>
  )
}
