"use client"

import { cn } from "@/lib/utils"

export interface LogoMarkProps {
  compact?: boolean
  className?: string
}

/**
 * Abstract overlapping-circles logo that echoes the bubble aesthetic.
 * Three translucent circles merge into a unified shape.
 */
function LogoSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {/* Bottom-left circle — warm orange */}
      <circle cx="13" cy="21" r="9" fill="#f4a261" opacity={0.85} />
      {/* Bottom-right circle — teal */}
      <circle cx="23" cy="21" r="9" fill="#2a9d8f" opacity={0.8} />
      {/* Top-center circle — coral */}
      <circle cx="18" cy="13" r="9" fill="#e76f51" opacity={0.85} />
    </svg>
  )
}

export function LogoMark({ compact = false, className }: LogoMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex size-8 items-center justify-center">
        <LogoSvg className="size-8" />
      </div>

      {!compact ? (
        <div className="space-y-0.5">
          <p className="font-heading text-base font-semibold tracking-tight text-foreground">
            Clustar
          </p>
          <p className="text-xs text-muted-foreground">
            Find any app, all in one place.
          </p>
        </div>
      ) : null}
    </div>
  )
}
