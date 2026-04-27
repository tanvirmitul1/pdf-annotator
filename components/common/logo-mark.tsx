"use client"

import { BookOpenText } from "lucide-react"

import { cn } from "@/lib/utils"

export interface LogoMarkProps {
  compact?: boolean
  className?: string
}

export function LogoMark({ compact = false, className }: LogoMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative flex size-9 items-center justify-center overflow-hidden rounded-lg border border-white/20 bg-primary text-primary-foreground shadow-sm">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.34),transparent_45%),linear-gradient(135deg,color-mix(in_oklab,var(--primary)_85%,white)_0%,color-mix(in_oklab,var(--accent)_68%,var(--primary))_100%)]" />
        <BookOpenText className="relative z-10 size-4" />
      </div>

      {!compact ? (
        <div className="space-y-0.5">
          <p className="font-heading text-base font-semibold tracking-tight text-foreground">
            PDF Annotator
          </p>
          <p className="text-xs text-muted-foreground">
            Review, mark up, and organize dense reading without losing the
            thread.
          </p>
        </div>
      ) : null}
    </div>
  )
}
