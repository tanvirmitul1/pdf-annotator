"use client"

import { useRef, useState, useEffect } from "react"
import { Eraser, Type, PenLine } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface SignatureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: string) => void
}

export function SignatureDialog({ open, onOpenChange, onSave }: SignatureDialogProps) {
  const [tab, setTab] = useState("draw")
  const [typedName, setTypedName] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  useEffect(() => {
    if (tab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.strokeStyle = "black"
        ctx.lineWidth = 2
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
      }
    }
  }, [tab, open])

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext("2d")
    ctx?.beginPath()
    ctx?.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    const pos = getPos(e)
    const ctx = canvasRef.current?.getContext("2d")
    ctx?.lineTo(pos.x, pos.y)
    ctx?.stroke()
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    ctx?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0)
  }

  const handleSave = () => {
    if (tab === "draw") {
      const data = canvasRef.current?.toDataURL()
      if (data) onSave(data)
    } else {
      // For typed signature, we'll render it to a canvas and get dataURL
      const canvas = document.createElement("canvas")
      canvas.width = 400
      canvas.height = 150
      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, 400, 150)
        ctx.font = "italic 40px 'Dancing Script', cursive, serif"
        ctx.fillStyle = "black"
        ctx.textAlign = "center"
        ctx.fillText(typedName, 200, 85)
        onSave(canvas.toDataURL())
      }
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden rounded-3xl border-border/40 bg-card/95 p-0 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold tracking-tight">Create Signature</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="draw" className="w-full" onValueChange={setTab}>
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-accent/20 p-1">
              <TabsTrigger value="draw" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <PenLine className="mr-2 size-4" /> Draw
              </TabsTrigger>
              <TabsTrigger value="type" className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm">
                <Type className="mr-2 size-4" /> Type
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="draw" className="mt-0 outline-none">
              <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-border/60 bg-muted/30">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={240}
                  className="cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-4 size-8 rounded-full bg-card/80 hover:bg-destructive hover:text-white"
                  onClick={clearCanvas}
                >
                  <Eraser className="size-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="type" className="mt-0 outline-none">
              <div className="space-y-6">
                <Input
                  className="h-12 rounded-xl border-border/40 bg-accent/20 text-lg focus:ring-primary/20"
                  placeholder="Type your name..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                />
                <div className="flex h-40 items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/10 p-8">
                  <span className="font-serif text-5xl italic text-primary/80 opacity-90 transition-opacity hover:opacity-100">
                    {typedName || "Your Signature"}
                  </span>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="border-t border-border/10 bg-accent/5 px-6 py-4">
          <Button variant="ghost" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className="rounded-xl px-8 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95" onClick={handleSave}>
            Add Signature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
