"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
}: ArtifactPanelProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10);
      if (!isNaN(parsedWidth)) {
        setWidth(parsedWidth);
      }
    }
  }, []);

  // Save width to localStorage
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
      
      // Calculate max width based on window size
      const maxWidth = (window.innerWidth * MAX_WIDTH_PERCENT) / 100;
      
      // Constrain width
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
      className="relative flex flex-col h-full"
      style={{ width: `${width}px` }}
    >
      {/* Resize Handle */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-10",
          "hover:bg-blue-500 transition-colors",
          isResizing && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Files
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
            {artifacts.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs for multiple artifacts */}
      {artifacts.length > 1 && (
        <div className="border-b border-slate-200 dark:border-slate-800">
          <ScrollArea className="w-full">
            <div className="flex gap-1 px-3 py-2">
              {artifacts.map((artifact) => {
                const Icon = getArtifactIcon(artifact.type, artifact.title);
                const isActive =
                  activeArtifact?.identifier === artifact.identifier;
                return (
                  <button
                    key={artifact.identifier}
                    onClick={() => onSelectArtifact(artifact)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {artifact.title}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Viewer */}
      {activeArtifact ? (
        <div className="flex-1 min-h-0">
          <ArtifactViewer
            artifact={activeArtifact}
            copiedId={copiedId}
            onCopy={onCopy}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select a file to view
          </p>
        </div>
      )}
    </div>
  );
}
