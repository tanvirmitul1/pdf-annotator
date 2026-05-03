"use client"

import { motion } from "framer-motion"
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minus, 
  Plus
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useViewer } from "@/features/viewer/provider"

export function BottomBar() {
  const currentPage = useViewer((state) => state.currentPage)
  const totalPages = useViewer((state) => state.totalPages)
  const setPage = useViewer((state) => state.setPage)
  const zoom = useViewer((state) => state.zoom)
  const setZoom = useViewer((state) => state.setZoom)

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.1, 4))
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.1, 0.25))
  
  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val) && val >= 1 && val <= totalPages) setPage(val)
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex h-11 max-w-[calc(100vw-2rem)] items-center gap-1.5 overflow-x-auto no-scrollbar rounded-full border border-border/40 bg-card/70 px-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.3)] backdrop-blur-2xl ring-1 ring-border/20 transition-all hover:bg-card/90"
      >
        {/* Page Navigation Group */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-1.5 px-1.5">
            <Input
              className="h-7 w-11 border-none bg-accent/40 px-0 text-center font-mono text-[11px] font-black focus-visible:ring-1 rounded-md"
              value={currentPage}
              onChange={handlePageChange}
            />
            <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-40 select-none">
              / {totalPages || "?"}
            </span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-5 opacity-30" />

        {/* Zoom Controls Group */}
        <div className="flex items-center gap-0.5 pr-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
          >
            <Minus className="size-3.5" />
          </Button>

          <button 
            className="min-w-[3.5rem] px-1 text-[11px] font-black tabular-nums text-primary hover:underline"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleZoomIn}
            disabled={zoom >= 4}
          >
            <Plus className="size-3.5" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-5 opacity-30 hidden sm:block" />
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full hidden sm:flex"
                onClick={() => setZoom(1.5)} 
              >
                <Maximize className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to Width</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}

