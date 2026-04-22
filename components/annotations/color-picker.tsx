"use client"

import { cn } from "@/lib/utils"
import { ANNOTATION_COLORS } from "@/features/annotations/types"

interface ColorPickerProps {
  value: string
  onChange: (hex: string) => void
  className?: string
  size?: "sm" | "md"
}

export function ColorPicker({
  value,
  onChange,
  className,
  size = "md",
}: ColorPickerProps) {
  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="radiogroup"
      aria-label="Annotation color"
    >
      {ANNOTATION_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          role="radio"
          aria-checked={value === c.hex}
          aria-label={c.label}
          title={c.label}
          onClick={() => onChange(c.hex)}
          className={cn(
            "rounded-full border-2 transition-transform duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            size === "sm" ? "size-4" : "size-5",
            value === c.hex
              ? "scale-110 border-foreground/80"
              : "border-transparent hover:scale-110 hover:border-foreground/30"
          )}
          style={{ backgroundColor: c.hex }}
        />
      ))}
    </div>
  )
}
