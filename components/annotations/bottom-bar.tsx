"use client"

import { motion } from "framer-motion"
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Minus, 
  Plus, 
  Search 
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
  const openSearch = useViewer((state) => state.openSearch)

  const handleZoomIn = () => setZoom(zoom + 0.1)
  const handleZoomOut = () => setZoom(zoom - 0.1)
  const handlePageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value)
    if (!isNaN(val)) setPage(val)
  }

  return (
    <TooltipProvider delayDuration={400}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex h-12 items-center gap-1 rounded-full border border-border/40 bg-card/80 px-2 shadow-2xl backdrop-blur-2xl transition-all hover:bg-card/95"
      >
        {/* Page Navigation */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Previous Page</TooltipContent>
          </Tooltip>

          <div className="flex items-center gap-1 px-2">
            <Input
              className="h-7 w-12 border-none bg-accent/30 px-1 text-center font-mono text-xs focus-visible:ring-1"
              value={currentPage}
              onChange={handlePageChange}
            />
            <span className="text-[10px] font-medium text-muted-foreground uppercase opacity-60">
              of {totalPages || "?"}
            </span>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Next Page</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 opacity-40" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={handleZoomOut}
              >
                <Minus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out</TooltipContent>
          </Tooltip>

          <button 
            className="px-2 text-[10px] font-bold tabular-nums text-primary hover:underline"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={handleZoomIn}
              >
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6 opacity-40" />

        {/* Fit to Width / Search */}
        <div className="flex items-center gap-0.5 pr-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={() => setZoom(1.5)} // Placeholder for "Fit to Width"
              >
                <Maximize className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to Width</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 rounded-full"
                onClick={openSearch}
              >
                <Search className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search (Ctrl+F)</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>
    </TooltipProvider>
  )
}
