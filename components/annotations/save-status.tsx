"use client"

import { Check, Loader2, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useViewer } from "@/features/viewer/provider"

export function SaveStatus({ className }: { className?: string }) {
  const status = useViewer((s) => s.saveStatus)

  if (status === "idle") return null

  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs transition-colors duration-200",
        status === "saved" && "text-green-500",
        status === "saving" && "text-muted-foreground",
        status === "offline" && "text-destructive",
        className
      )}
      role="status"
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <Loader2 className="size-3 animate-spin" />
          Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <Check className="size-3" />
          Saved
        </>
      )}
      {status === "offline" && (
        <>
          <WifiOff className="size-3" />
          Offline — will retry
        </>
      )}
    </span>
  )
}
