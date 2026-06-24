"use client";

import { useState } from "react";
import { Check, Copy, Download, Loader2, Code2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Artifact } from "../_lib/types";
import { getArtifactIcon } from "../_lib/icons";
import {
  downloadArtifact,
  getDisplayContent,
} from "../_lib/file-generators/download-artifact";
import { CodeHighlight } from "./code-highlight";
import { HtmlPreview } from "./html-preview";

interface ArtifactViewerProps {
  artifact: Artifact;
  copiedId: string | null;
  onCopy: (text: string, id: string) => void;
}

type ViewMode = "code" | "preview";

const PREVIEWABLE_TYPES = ["html", "css", "svg"];

export function ArtifactViewer({
  artifact,
  copiedId,
  onCopy,
}: ArtifactViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("code");
  
  const Icon = getArtifactIcon(artifact.type, artifact.title);
  const isCopied = copiedId === artifact.identifier;
  const ext = artifact.title.split(".").pop()?.toLowerCase();
  const isPdf = artifact.type === "pdf" || ext === "pdf";
  const isDocx =
    artifact.type === "docx" ||
    artifact.type === "doc" ||
    ext === "docx" ||
    ext === "doc";

  const isPreviewable = PREVIEWABLE_TYPES.includes(artifact.type) || 
                        (ext && PREVIEWABLE_TYPES.includes(ext));

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadArtifact(artifact);
    } finally {
      setDownloading(false);
    }
  };

  const displayContent = getDisplayContent(artifact);
  const downloadLabel = isPdf
    ? "Download PDF"
    : isDocx
      ? "Download Word doc"
      : "Download file";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {artifact.title}
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* View Mode Toggle */}
          {isPreviewable && (
            <div className="flex items-center gap-0.5 mr-1 bg-slate-100 dark:bg-slate-800 rounded p-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("code")}
                      className={cn(
                        "h-6 w-6",
                        viewMode === "code" && "bg-white dark:bg-slate-700"
                      )}
                    >
                      <Code2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Code</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("preview")}
                      className={cn(
                        "h-6 w-6",
                        viewMode === "preview" && "bg-white dark:bg-slate-700"
                      )}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Preview</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCopy(artifact.content, artifact.identifier)}
                  className="h-7 w-7"
                >
                  {isCopied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isCopied ? "Copied!" : "Copy"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="h-7 w-7 bg-blue-600 hover:bg-blue-700"
                >
                  {downloading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{downloadLabel}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {viewMode === "preview" && isPreviewable ? (
          <div className="h-full p-1">
            <HtmlPreview html={artifact.content} className="h-full" />
          </div>
        ) : (
          <div className="h-full bg-slate-900">
            <CodeHighlight
              code={displayContent}
              language={artifact.type}
              className="h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
