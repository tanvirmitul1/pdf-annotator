"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFPageProxy, RenderTask } from "pdfjs-dist"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

export interface PdfCanvasProps {
  page: PDFPageProxy | null
  zoom: number
  rotation: number
  /** If true, render actively; if false, show placeholder */
  active: boolean
  /** Pre-computed natural width/height at zoom=1 */
  naturalWidth: number
  naturalHeight: number
  searchMatches?: Array<{ startOffset: number; endOffset: number }>
  isCurrentMatch?: boolean
}

export function PdfCanvas({
  page,
  zoom,
  rotation,
  active,
  naturalWidth,
  naturalHeight,
  searchMatches = [],
  isCurrentMatch = false,
}: PdfCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [renderError, setRenderError] = useState(false)
  // Keep the actual RenderTask so we can await its cancellation
  const renderTaskRef = useRef<RenderTask | null>(null)

  const scaledW = Math.round(naturalWidth * zoom)
  const scaledH = Math.round(naturalHeight * zoom)

  useEffect(() => {
    if (!active || !page || !canvasRef.current) return

    let cancelled = false
    const canvas = canvasRef.current

    async function render() {
      // Cancel the previous task and wait for it to fully stop.
      // pdfjs uses a WeakSet to track canvas-in-use; if we start a new
      // render before the previous one releases the canvas from the WeakSet,
      // the private-field WeakSet.add() call fails with
      // "Object.defineProperty called on non-object" in bundled environments.
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        try {
          await renderTaskRef.current.promise
        } catch {
          // RenderingCancelledException is expected — swallow it
        }
        renderTaskRef.current = null
      }

      if (cancelled || !canvasRef.current) return

      setRenderError(false)

      if (!page) return
      const viewport = page.getViewport({ scale: zoom, rotation })
      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const task = page.render({
        canvas,
        canvasContext: ctx,
        viewport,
      })
      renderTaskRef.current = task

      try {
        await task.promise
      } catch (err: unknown) {
        if (
          !cancelled &&
          (err as { name?: string })?.name !== "RenderingCancelledException"
        ) {
          setRenderError(true)
        }
      }
    }

    void render()

    return () => {
      cancelled = true
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [page, zoom, rotation, active])

  // Clear canvas when page leaves the virtual window
  useEffect(() => {
    if (!active && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    }
  }, [active])

  if (renderError) {
    return (
      <div
        style={{ width: scaledW, height: scaledH }}
        className="flex flex-col items-center justify-center gap-2 rounded border border-border bg-card text-sm text-muted-foreground"
      >
        <AlertCircle className="size-5 text-destructive" />
        <span>Page failed to render</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => setRenderError(false)}
        >
          <RefreshCw className="size-3" />
          Retry
        </Button>
      </div>
    )
  }

  if (!active) {
    return (
      <div
        style={{ width: scaledW, height: scaledH }}
        className="animate-pulse rounded bg-muted"
        aria-hidden
      />
    )
  }

  return (
    <div style={{ width: scaledW, height: scaledH }} className="relative">
      <canvas ref={canvasRef} className="block" aria-label="PDF page" />
      {/* Search highlight overlays */}
      {searchMatches.length > 0 && (
        <div
          className={`pointer-events-none absolute inset-0 ${
            isCurrentMatch ? "ring-2 ring-primary" : ""
          }`}
        >
          {/* Yellow highlight band for current match page */}
          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400/60" />
        </div>
      )}
    </div>
  )
}
