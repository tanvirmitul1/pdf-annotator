"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function ViewerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Viewer error:", error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="size-12 text-destructive" />
      <div>
        <p className="text-lg font-semibold">Failed to load document</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message ?? "Something went wrong"}
        </p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  )
}
