"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Type } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
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
  
  // These would need to be added to the viewer store:
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
      <motion.div
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -10, opacity: 0 }}
        className="flex h-12 items-center gap-2 rounded-full border border-border/40 bg-card/80 px-4 shadow-xl backdrop-blur-2xl"
      >
        {hasColor && (
          <div className="flex items-center gap-2">
            <ColorPicker
              value={selectedColor}
              onChange={setSelectedColor}
              size="sm"
            />
            <Separator orientation="vertical" className="h-6" />
          </div>
        )}

        {hasThickness && (
          <div className="flex items-center gap-3 px-1">
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Size</span>
               <input
                  type="range"
                  min={activeTool === "eraser" ? 8 : 2}
                  max={activeTool === "freehandHighlight" ? 40 : activeTool === "eraser" ? 64 : 20}
                  value={toolThickness}
                  onChange={(e) => setToolThickness(Number(e.target.value))}
                  className="w-24 h-1 bg-accent/50 rounded-full appearance-none cursor-pointer accent-primary"
               />
               <span className="text-[10px] font-mono tabular-nums w-4">{toolThickness}</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
          </div>
        )}

        {hasTextOptions && (
          <div className="flex items-center gap-2">
            {/* Font Family */}
            <div className="flex items-center gap-1">
              {FONTS.map((font) => (
                <button
                  key={font.value}
                  onClick={() => setFont?.(font.value)}
                  className={cn(
                    "px-2 py-1 text-xs rounded-md transition-colors",
                    activeFont === font.value ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {font.name}
                </button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-6" />
            
            {/* Font Size */}
            <div className="flex items-center gap-1">
              {FONT_SIZES.map((size) => (
                <button
                  key={size.value}
                  onClick={() => setFontSize?.(size.value)}
                  className={cn(
                    "size-7 flex items-center justify-center text-[10px] font-bold rounded-md transition-colors",
                    activeFontSize === size.value ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground"
                  )}
                >
                  {size.label}
                </button>
              ))}
            </div>
            <Separator orientation="vertical" className="h-6" />

            {/* Alignment */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setAlign?.("left")}
                className={cn("p-1.5 rounded-md", activeAlign === "left" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}
              >
                <AlignLeft className="size-4" />
              </button>
              <button 
                onClick={() => setAlign?.("center")}
                className={cn("p-1.5 rounded-md", activeAlign === "center" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}
              >
                <AlignCenter className="size-4" />
              </button>
              <button 
                onClick={() => setAlign?.("right")}
                className={cn("p-1.5 rounded-md", activeAlign === "right" ? "bg-primary text-primary-foreground" : "hover:bg-accent text-muted-foreground")}
              >
                <AlignRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </TooltipProvider>
  )
}
