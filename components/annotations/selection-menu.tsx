"use client"

import { Underline, Strikethrough, Waves, X, Highlighter } from "lucide-react"
import { cn } from "@/lib/utils"
import { ANNOTATION_COLORS } from "@/features/annotations/types"
import { motion } from "framer-motion"

interface SelectionMenuProps {
  position: { x: number; y: number }
  selectedColor: string
  onApply: (type: "HIGHLIGHT" | "UNDERLINE" | "STRIKETHROUGH" | "SQUIGGLY") => void
  onColorSelect: (hex: string) => void
  onDismiss: () => void
}

export function SelectionMenu({
  position,
  selectedColor,
  onApply,
  onColorSelect,
  onDismiss,
}: SelectionMenuProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 10 }}
      className="absolute z-50 flex flex-col gap-2 rounded-xl border border-border/40 bg-popover/90 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-border/20 pointer-events-auto"
      style={{ top: position.y - 10, left: position.x, transform: "translate(-50%, -100%)" }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => onApply("HIGHLIGHT")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Highlight"
        >
          <Highlighter className="size-4" style={{ color: selectedColor }} />
        </button>
        <button
          onClick={() => onApply("UNDERLINE")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Underline"
        >
          <Underline className="size-4" style={{ color: selectedColor }} />
        </button>
        <button
          onClick={() => onApply("STRIKETHROUGH")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Strikethrough"
        >
          <Strikethrough className="size-4" style={{ color: selectedColor }} />
        </button>
        <button
          onClick={() => onApply("SQUIGGLY")}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Squiggly"
        >
          <Waves className="size-4" style={{ color: selectedColor }} />
        </button>
        <div className="mx-1 h-4 w-px bg-border/40" />
        <button
          onClick={onDismiss}
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
          title="Close"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-1 py-1 border-t border-border/20">
        {ANNOTATION_COLORS.map((c) => (
          <button
            key={c.id}
            onClick={() => onColorSelect(c.hex)}
            className={cn(
              "size-5 rounded-full border-2 transition-transform hover:scale-110 shadow-sm",
              selectedColor === c.hex ? "border-foreground/80 scale-110 shadow-md" : "border-background/20"
            )}
            style={{ backgroundColor: c.hex }}
            title={c.label}
          />
        ))}
      </div>
    </motion.div>
  )
}
