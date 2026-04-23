"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetDocumentViewerDataQuery } from "@/features/viewer/api"

interface ImageViewerProps {
  documentId: string
  documentName: string
  initialStatus?: string
}

export function ImageViewer({
  documentId,
  documentName,
  initialStatus = "PROCESSING",
}: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const { data, isLoading, refetch } = useGetDocumentViewerDataQuery(documentId)
  const status = data?.document.status ?? initialStatus

  useEffect(() => {
    if (status === "READY") {
      fetch(`/api/documents/${documentId}/download?flavor=original`)
        .then((res) => res.json())
        .then((payload) => setImageUrl(payload.url))
        .catch(console.error)
      return
    }

    const interval = window.setInterval(() => {
      void refetch()
    }, 2000)

    return () => window.clearInterval(interval)
  }, [documentId, refetch, status])

  const handleDownload = async () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank")
    }
  }

  if (status !== "READY" || !imageUrl) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-border/60 bg-card/55 px-6">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            <Loader2 className="size-5 animate-spin" />
          </div>
          <div className="space-y-2">
            <p className="font-heading text-lg font-semibold text-foreground">
              {isLoading ? "Opening file" : "Preparing file"}
            </p>
            <p className="text-sm text-muted-foreground">
              Your image will open here as soon as it is ready.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-border/60 bg-card/55 shadow-[0_28px_80px_-55px_rgba(15,23,42,0.65)]">
      {/* Toolbar */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/75 px-4 backdrop-blur-xl">
        <h1 className="truncate font-heading text-base font-semibold">{documentName}</h1>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="min-w-[4rem] text-center text-sm">{Math.round(zoom * 100)}%</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            disabled={zoom >= 4}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownload}>
            <Download className="size-4" />
          </Button>
        </div>
      </div>

      {/* Image display */}
      <div className="flex-1 overflow-auto bg-muted/30 p-8">
        <div className="flex min-h-full items-center justify-center">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "center", transition: "transform 0.2s" }}>
            <Image
              src={imageUrl}
              alt={documentName}
              unoptimized
              width={1200}
              height={1600}
              className="h-auto max-h-[80vh] w-auto max-w-full rounded-lg shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
