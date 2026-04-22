"use client"

import { MessageSquare, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ANNOTATION_COLORS } from "@/features/annotations/types"

interface InlineToolbarProps {
  position: { x: number; y: number }
  onColorSelect: (hex: string) => void
  onComment: () => void
  onDismiss: () => void
  selectedColor: string
  className?: string
}

/**
 * Small floating toolbar that appears after the user selects text.
 * Shows color swatches + comment icon + dismiss button.
 */
export function InlineToolbar({
  position,
  onColorSelect,
  onComment,
  onDismiss,
  selectedColor,
  className,
}: InlineToolbarProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto absolute z-50 flex items-center gap-1 rounded-lg border border-border/70 bg-card/95 px-2 py-1 shadow-lg backdrop-blur-xl",
        className
      )}
      style={{ top: position.y, left: position.x, transform: "translateY(-110%)" }}
      role="toolbar"
      aria-label="Annotation options"
    >
      {ANNOTATION_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          aria-label={`Highlight in ${c.label}`}
          title={c.label}
          onClick={() => onColorSelect(c.hex)}
          className={cn(
            "size-5 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            selectedColor === c.hex ? "border-foreground/80" : "border-transparent"
          )}
          style={{ backgroundColor: c.hex }}
        />
      ))}

      <div className="mx-1 h-4 w-px bg-border" />

      <button
        type="button"
        aria-label="Add comment"
        title="Add comment"
        onClick={onComment}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <MessageSquare className="size-3.5" />
      </button>

      <button
        type="button"
        aria-label="Dismiss"
        title="Dismiss"
        onClick={onDismiss}
        className="flex size-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
