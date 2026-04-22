"use client"

import { useEffect, useRef, useState } from "react"
import type { PDFPageProxy, RenderTask } from "pdfjs-dist"
import { AlertCircle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"

interface TextLayerItem {
  id: string
  text: string
  left: number
  top: number
  fontSize: number
  scaleX: number
  angle: number
  fontFamily: string
}

export interface PdfCanvasProps {
  page: PDFPageProxy | null
  zoom: number
  rotation: number
  active: boolean
  naturalWidth: number
  naturalHeight: number
  searchMatches?: Array<{ startOffset: number; endOffset: number }>
  isCurrentMatch?: boolean
}

type TransformMatrix = [number, number, number, number, number, number]

function multiplyTransform(
  left: number[],
  right: number[]
): TransformMatrix {
  return [
    left[0] * right[0] + left[2] * right[1],
    left[1] * right[0] + left[3] * right[1],
    left[0] * right[2] + left[2] * right[3],
    left[1] * right[2] + left[3] * right[3],
    left[0] * right[4] + left[2] * right[5] + left[4],
    left[1] * right[4] + left[3] * right[5] + left[5],
  ]
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
  const [textItems, setTextItems] = useState<TextLayerItem[]>([])
  const renderTaskRef = useRef<RenderTask | null>(null)

  const scaledW = Math.round(naturalWidth * zoom)
  const scaledH = Math.round(naturalHeight * zoom)

  useEffect(() => {
    if (!active || !page || !canvasRef.current) return

    let cancelled = false
    const canvas = canvasRef.current
    const pageProxy = page

    async function render() {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        try {
          await renderTaskRef.current.promise
        } catch {
          // Ignore cancelled render passes while zoom/rotation changes.
        }
        renderTaskRef.current = null
      }

      if (cancelled || !canvasRef.current) return

      setRenderError(false)

      const viewport = pageProxy.getViewport({ scale: zoom, rotation })
      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const task = pageProxy.render({
        canvas,
        canvasContext: ctx,
        viewport,
      })
      renderTaskRef.current = task

      try {
        await task.promise
      } catch (error: unknown) {
        if (
          !cancelled &&
          (error as { name?: string })?.name !== "RenderingCancelledException"
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
  }, [active, page, rotation, zoom])

  useEffect(() => {
    if (!active || !page) {
      setTextItems([])
      return
    }

    let cancelled = false
    const pageProxy = page

    async function loadTextLayer() {
      const viewport = pageProxy.getViewport({ scale: zoom, rotation })
      const textContent = await pageProxy.getTextContent()
      const styles = textContent.styles as Record<
        string,
        { ascent?: number; fontFamily?: string; vertical?: boolean }
      >

      const nextItems: TextLayerItem[] = textContent.items.flatMap((item, index) => {
        if (!("str" in item)) {
          return []
        }

        const tx = multiplyTransform(
          viewport.transform as TransformMatrix,
          item.transform as TransformMatrix
        )

        const style = styles[item.fontName] ?? {}
        const angle = style.vertical ? Math.PI / 2 : Math.atan2(tx[1], tx[0])
        const fontHeight = Math.hypot(tx[2], tx[3])
        const fontAscent = (style.ascent ?? 0.8) * fontHeight
        const fontWidth = Math.hypot(tx[0], tx[1])

        return [
          {
            id: `${pageProxy.pageNumber}-${index}`,
            text: item.str,
            left: tx[4],
            top: tx[5] - fontAscent,
            fontSize: Math.max(fontHeight, 1),
            scaleX: fontWidth / Math.max(fontHeight, 1),
            angle,
            fontFamily: style.fontFamily ?? "sans-serif",
          },
        ]
      })

      if (!cancelled) {
        setTextItems(nextItems)
      }
    }

    void loadTextLayer()

    return () => {
      cancelled = true
    }
  }, [active, page, rotation, zoom])

  useEffect(() => {
    if (!active && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
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

  const pageNumberForLayer = page?.pageNumber ?? "unknown"

  return (
    <div style={{ width: scaledW, height: scaledH }} className="relative">
      <canvas ref={canvasRef} className="block" aria-label="PDF page" />

      <div
        aria-hidden="true"
        data-text-layer={pageNumberForLayer}
        className="absolute inset-0 overflow-hidden select-text"
      >
        {textItems.map((item) => (
          <span
            key={item.id}
            data-text-span="true"
            data-text-content={item.text}
            style={{
              position: "absolute",
              left: item.left,
              top: item.top,
              fontSize: item.fontSize,
              fontFamily: item.fontFamily,
              transform: `scaleX(${item.scaleX}) rotate(${item.angle}rad)`,
              transformOrigin: "0 0",
              whiteSpace: "pre",
              color: "transparent",
              userSelect: "text",
              cursor: "text",
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      {searchMatches.length > 0 ? (
        <div
          className={`pointer-events-none absolute inset-0 ${
            isCurrentMatch ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400/60" />
        </div>
      ) : null}
    </div>
  )
}
