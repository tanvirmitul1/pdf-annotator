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
    <div className="flex flex-col h-full min-w-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-3 border-b border-border/50 min-w-0">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded bg-primary flex items-center justify-center shrink-0">
            <Icon className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground truncate">
              {artifact.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* View Mode Toggle */}
          {isPreviewable && (
            <div className="flex items-center gap-0.5 mr-1 bg-muted/50 rounded p-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("code")}
                      className={cn(
                        "h-6 w-6",
                        viewMode === "code" && "bg-background shadow-sm"
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
                        viewMode === "preview" && "bg-background shadow-sm"
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
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
                  className="h-7 w-7 bg-primary hover:bg-primary/90 text-primary-foreground"
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
      <div className="flex-1 min-h-0 min-w-0 overflow-auto">
        {viewMode === "preview" && isPreviewable ? (
          <div className="h-full p-1">
            <HtmlPreview html={artifact.content} className="h-full" />
          </div>
        ) : (
          <div className="h-full bg-muted">
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
