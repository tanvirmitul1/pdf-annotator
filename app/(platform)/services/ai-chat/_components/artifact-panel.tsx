"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Artifact } from "../_lib/types";
import { getArtifactIcon } from "../_lib/icons";
import { ArtifactViewer } from "./artifact-viewer";

interface ArtifactPanelProps {
  artifacts: Artifact[];
  activeArtifact: Artifact | null;
  onSelectArtifact: (artifact: Artifact) => void;
  onClose: () => void;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
  /** When true, panel fills its container width (used in mobile overlay) */
  fullWidth?: boolean;
}

const MIN_WIDTH = 400;
const MAX_WIDTH_PERCENT = 60;
const DEFAULT_WIDTH = 600;
const STORAGE_KEY = "artifact-panel-width";

export function ArtifactPanel({
  artifacts,
  activeArtifact,
  onSelectArtifact,
  onClose,
  copiedId,
  onCopy,
  fullWidth = false,
}: ArtifactPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth)) {
        setWidth(parsedWidth);
      }
    }
  }, []);

  const saveWidth = useCallback((newWidth: number) => {
    localStorage.setItem(STORAGE_KEY, newWidth.toString());
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();
      const newWidth = rect.right - e.clientX;
      const maxWidth = (window.innerWidth * MAX_WIDTH_PERCENT) / 100;
      const constrainedWidth = Math.max(MIN_WIDTH, Math.min(newWidth, maxWidth));
      setWidth(constrainedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      saveWidth(width);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, width, saveWidth]);

  return (
    <div
      ref={panelRef}
      className={cn(
        "relative flex flex-col h-full overflow-hidden",
        fullWidth ? "w-full" : "max-w-[calc(100vw-4rem)]"
      )}
      style={fullWidth ? undefined : { width: `${width}px` }}
    >
      {/* Resize Handle (desktop only) */}
      {!fullWidth && (
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10 transition-all duration-150",
            "hover:bg-primary/50",
            isResizing ? "bg-primary" : "bg-transparent"
          )}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-foreground">
            Files
          </h2>
          <span className="text-[11px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md font-mono">
            {artifacts.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs for multiple artifacts */}
      {artifacts.length > 1 && (
        <div className="border-b border-border/50">
          <ScrollArea className="w-full" viewportClassName="overflow-x-auto">
            <div className="flex gap-1 px-3 py-2 min-w-max">
              {artifacts.map((artifact) => {
                const Icon = getArtifactIcon(artifact.type, artifact.title);
                const isActive =
                  activeArtifact?.identifier === artifact.identifier;
                return (
                  <button
                    key={artifact.identifier}
                    onClick={() => onSelectArtifact(artifact)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150",
                      isActive
                        ? "bg-primary/10 text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {artifact.title}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Viewer */}
      {activeArtifact ? (
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <ArtifactViewer
            artifact={activeArtifact}
            copiedId={copiedId}
            onCopy={onCopy}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a file to view
          </p>
        </div>
      )}
    </div>
  );
}
