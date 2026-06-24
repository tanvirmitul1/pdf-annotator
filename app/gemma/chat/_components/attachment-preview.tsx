"use client";

import { AudioLines, Loader2, ScanText, X, CheckCircle2, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ChatAttachment } from "../_lib/types";

interface AttachmentPreviewProps {
  attachments: ChatAttachment[];
  ocrLoading: Record<string, boolean>;
  ocrProgress: Record<string, string>;
  ocrErrors: Record<string, string>;
  onRemove: (id: string) => void;
  onRunOcr: (id: string) => void;
  onRetryOcr: (id: string) => void;
  onCancelOcr: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function AttachmentPreview({
  attachments,
  ocrLoading,
  ocrProgress,
  ocrErrors,
  onRemove,
  onRunOcr,
  onRetryOcr,
  onCancelOcr,
}: AttachmentPreviewProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 px-3 py-2.5 border-b border-border/40">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {attachments.map((attachment) => {
          const isOcrRunning = ocrLoading[attachment.id] ?? false;
          const hasOcr = !!attachment.ocrText;
          const ocrError = ocrErrors[attachment.id];
          const progress = ocrProgress[attachment.id];
          const isAudio = attachment.kind === "audio";

          if (isAudio) {
            return (
              <div
                key={attachment.id}
                className={cn(
                  "relative group shrink-0 rounded-xl overflow-hidden",
                  "bg-muted/30 px-3 py-2.5",
                  "border border-border/50 hover:border-primary/40",
                  "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                  "flex flex-col gap-2 min-w-48 max-w-64"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <AudioLines className="size-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">
                      {attachment.fileName}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {attachment.duration
                        ? formatDuration(attachment.duration)
                        : "Audio"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="shrink-0 size-6 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemove(attachment.id)}
                    aria-label={`Remove ${attachment.fileName}`}
                  >
                    <X className="size-3" />
                  </Button>
                </div>

                <audio
                  src={attachment.preview}
                  controls
                  preload="metadata"
                  className="w-full h-8 rounded-lg [&::-webkit-media-controls-panel]:bg-muted/50"
                />
              </div>
            );
          }

          return (
            <div
              key={attachment.id}
              className={cn(
                "relative group shrink-0 rounded-xl overflow-hidden",
                "w-24 h-24 bg-muted/30",
                "border border-border/50",
                isOcrRunning && "ring-2 ring-primary/50 ring-offset-2",
                ocrError && "ring-2 ring-destructive/50 ring-offset-2",
                hasOcr && !ocrError && "ring-2 ring-accent/50 ring-offset-2",
                "transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachment.preview}
                alt={attachment.fileName}
                className={cn(
                  "w-full h-full object-cover",
                  isOcrRunning && "brightness-75"
                )}
              />

              {/* Status badges */}
              {hasOcr && !ocrError && !isOcrRunning && (
                <div className="absolute top-1 right-1 bg-accent text-accent-foreground rounded-full p-1 shadow-lg">
                  <CheckCircle2 className="size-3" />
                </div>
              )}

              {ocrError && !isOcrRunning && (
                <div className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 shadow-lg">
                  <AlertCircle className="size-3" />
                </div>
              )}

              {/* Cache hit badge */}
              {attachment.ocrCacheHit && (
                <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[8px] px-1.5 py-0.5 rounded-md font-semibold shadow-sm">
                  {attachment.ocrCacheHit === "redis" ? "⚡ CACHED" : "💾 CACHED"}
                </div>
              )}

              {/* OCR Progress Overlay */}
              {isOcrRunning && (
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/75 to-transparent backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-2">
                  <Loader2 className="size-6 text-primary animate-spin" />
                  <p className="text-[10px] text-foreground font-medium text-center leading-tight">
                    {progress || "Processing..."}
                  </p>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-foreground hover:bg-muted size-6 mt-1"
                    onClick={() => onCancelOcr(attachment.id)}
                    aria-label="Cancel OCR"
                  >
                    <XCircle className="size-3.5" />
                  </Button>
                </div>
              )}

              {/* Error Overlay */}
              {ocrError && !isOcrRunning && (
                <div className="absolute inset-0 bg-gradient-to-t from-destructive/90 via-destructive/60 to-transparent backdrop-blur-sm flex flex-col items-center justify-center gap-1.5 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <AlertCircle className="size-5 text-destructive-foreground" />
                  <p className="text-[9px] text-destructive-foreground font-medium text-center leading-tight line-clamp-2">
                    {ocrError}
                  </p>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="text-destructive-foreground hover:bg-destructive/20 size-6 mt-1"
                    onClick={() => onRetryOcr(attachment.id)}
                    aria-label="Retry OCR"
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>
              )}

              {/* Hover Actions */}
              {!isOcrRunning && !ocrError && (
                <div className="absolute inset-0 bg-background/75 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5">
                  {!hasOcr && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="text-white hover:bg-white/20 size-7 rounded-lg"
                            onClick={() => onRunOcr(attachment.id)}
                            aria-label="Run OCR"
                          >
                            <ScanText className="size-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Extract text</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-white hover:bg-white/20 size-7 rounded-lg"
                          onClick={() => onRemove(attachment.id)}
                          aria-label={`Remove ${attachment.fileName}`}
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Remove</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Summary */}
      {Object.keys(ocrLoading).some(id => ocrLoading[id]) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <Loader2 className="size-3 animate-spin" />
          <span>Processing OCR...</span>
        </div>
      )}
    </div>
  );
}
