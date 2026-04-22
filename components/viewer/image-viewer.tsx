"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageViewerProps {
  documentId: string
  documentName: string
}

export function ImageViewer({ documentId, documentName }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  // Fetch the signed URL for the image
  useEffect(() => {
    fetch(`/api/documents/${documentId}/download?flavor=original`)
      .then(res => res.json())
      .then(data => setImageUrl(data.url))
      .catch(console.error)
  }, [documentId])

  const handleDownload = async () => {
    if (imageUrl) {
      window.open(imageUrl, "_blank")
    }
  }

  if (!imageUrl) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-border/60 bg-card/55">
        <p className="text-sm text-muted-foreground">Loading image...</p>
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
