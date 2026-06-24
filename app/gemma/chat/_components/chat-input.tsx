"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { ArrowUp, Mic, MicOff, Paperclip, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_AUDIO_TYPES,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
} from "../_lib/image-utils";
import type { ChatAttachment } from "../_lib/types";
import { AttachmentPreview } from "./attachment-preview";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (attachments?: ChatAttachment[], hasOcrPending?: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  onStop: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  variant?: "landing" | "compact";
  attachments: ChatAttachment[];
  ocrLoading: Record<string, boolean>;
  ocrProgress: Record<string, string>;
  ocrErrors: Record<string, string>;
  onAddFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onRunOcr: (id: string) => void;
  onRetryOcr: (id: string) => void;
  onCancelOcr: (id: string) => void;
  onClearAttachments: () => void;
  isListening: boolean;
  isSpeechSupported: boolean;
  onToggleSpeech: () => void;
  isGateway: boolean;
  hasOcrPending: boolean;
  backend?: "local" | "gateway-api";
  onBackendChange?: (backend: "local" | "gateway-api") => void;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  onKeyDown,
  isLoading,
  onStop,
  textareaRef,
  variant = "compact",
  attachments,
  ocrLoading,
  ocrProgress,
  ocrErrors,
  onAddFiles,
  onRemoveAttachment,
  onRunOcr,
  onRetryOcr,
  onCancelOcr,
  onClearAttachments,
  isListening,
  isSpeechSupported,
  onToggleSpeech,
  isGateway,
  hasOcrPending,
  backend = "local",
  onBackendChange,
}: ChatInputProps) {
  const isLanding = variant === "landing";

  const handleSubmit = useCallback(() => {
    const hasContent = input.trim() || attachments.length > 0;
    if (!hasContent) return;
    onSubmit(attachments.length > 0 ? attachments : undefined, hasOcrPending);
    onClearAttachments();
  }, [input, attachments, hasOcrPending, onSubmit, onClearAttachments]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
        return;
      }
      onKeyDown(e);
    },
    [handleSubmit, onKeyDown]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted.length > 0) onAddFiles(accepted);
    },
    [onAddFiles]
  );



  const maxSize = Math.max(MAX_IMAGE_SIZE, MAX_AUDIO_SIZE);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: isGateway
      ? {
          "image/*": ACCEPTED_IMAGE_TYPES.map((t) => `.${t.split("/")[1]}`),
        }
      : {
          "image/*": ACCEPTED_IMAGE_TYPES.map((t) => `.${t.split("/")[1]}`),
          "audio/*": ACCEPTED_AUDIO_TYPES.map((t) => `.${t.split("/")[1]}`),
        },
    maxSize,
    noClick: true,
    noKeyboard: true,
  });

  return (
    <div className={cn("shrink-0", isLanding ? "w-full" : "p-3 sm:p-4")}>
      <div className={cn("mx-auto", isLanding ? "max-w-2xl" : "max-w-3xl")}>
        <div
          {...getRootProps()}
          className={cn(
            "rounded-2xl border transition-all duration-200",
            "gemma-glass-heavy",
            isLanding ? "gemma-shadow-lg" : "gemma-shadow",
            isDragActive
              ? "border-primary/60 ring-2 ring-primary/20 gemma-glow"
              : "border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40"
          )}
        >
          <input {...getInputProps()} />

          {/* Drag overlay text */}
          {isDragActive && (
            <div className="px-4 py-3 text-sm text-primary text-center font-semibold animate-message-in">
              {isGateway ? "Drop images here (will be OCR'd)" : "Drop images or audio files here"}
            </div>
          )}

          {/* Attachment previews */}
          <AttachmentPreview
            attachments={attachments}
            ocrLoading={ocrLoading}
            ocrProgress={ocrProgress}
            ocrErrors={ocrErrors}
            onRemove={onRemoveAttachment}
            onRunOcr={onRunOcr}
            onRetryOcr={onRetryOcr}
            onCancelOcr={onCancelOcr}
          />

          {/* Input row */}
          <div
            className={cn(
              "flex items-end gap-2",
              isLanding ? "px-4 py-3" : "px-3 py-2.5"
            )}
          >
            {/* Attach button - Always show, but images will be OCR'd for gateway */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size={isLanding ? "icon" : "icon-sm"}
                    onClick={open}
                    disabled={isLoading}
                    aria-label="Attach file"
                    className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Paperclip className={isLanding ? "size-5" : "size-4"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  {isGateway ? "Attach image (will be OCR'd)" : "Attach image or audio"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDragActive
                  ? "Drop files..."
                  : isLanding
                    ? "Ask Gemma anything..."
                    : "Message Gemma..."
              }
              disabled={isLoading}
              rows={isLanding ? 2 : 1}
              className={cn(
                "flex-1 resize-none bg-transparent text-foreground placeholder:text-muted-foreground",
                "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                isLanding
                  ? "text-base min-h-13 max-h-50 py-1.5"
                  : "text-sm min-h-6 max-h-50 py-1"
              )}
            />

            {/* Backend Selector */}
            {onBackendChange && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isLanding ? "icon" : "icon-sm"}
                      onClick={() => onBackendChange(backend === "local" ? "gateway-api" : "local")}
                      disabled={isLoading}
                      aria-label="Switch backend"
                      className={cn(
                        "shrink-0 transition-colors",
                        backend === "gateway-api"
                          ? "text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          : "text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
                      )}
                    >
                      <Zap className={isLanding ? "size-5" : "size-4"} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="text-center">
                      <p className="font-medium">
                        {backend === "local" ? "Local Mode" : "Gateway Mode"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Click to switch to {backend === "local" ? "gateway" : "local"}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Mic button */}
            {isSpeechSupported && !isGateway && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isLanding ? "icon" : "icon-sm"}
                      onClick={onToggleSpeech}
                      disabled={isLoading}
                      aria-label={isListening ? "Stop listening" : "Start voice input"}
                      className={cn(
                        "shrink-0 relative transition-colors",
                        isListening
                          ? "text-red-500 hover:text-red-600 hover:bg-red-500/10 gemma-mic-pulse"
                          : "hover:bg-primary/10 hover:text-primary"
                      )}
                    >
                      {isListening ? (
                        <MicOff className={isLanding ? "size-5" : "size-4"} />
                      ) : (
                        <Mic className={isLanding ? "size-5" : "size-4"} />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {isListening ? "Stop listening" : "Voice input"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Send / Stop button */}
            {isLoading ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size={isLanding ? "icon" : "icon-sm"}
                      onClick={onStop}
                      aria-label="Stop generating"
                      className={cn(
                        "shrink-0 rounded-xl transition-all duration-200",
                        "bg-destructive/90 text-white border-0",
                        "hover:bg-destructive hover:shadow-lg",
                        isLanding && "size-10 rounded-xl"
                      )}
                    >
                      <Square
                        className={cn(
                          "fill-current",
                          isLanding ? "size-4" : "size-3"
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Stop generating</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                size={isLanding ? "icon" : "icon-sm"}
                onClick={handleSubmit}
                disabled={!input.trim() && attachments.length === 0}
                aria-label="Send message"
                className={cn(
                  "shrink-0 rounded-xl transition-all duration-200",
                  "gemma-gradient text-white border-0",
                  "hover:opacity-90 hover:shadow-lg",
                  "disabled:opacity-40 disabled:gemma-gradient",
                  isLanding && "size-10 rounded-xl"
                )}
              >
                <ArrowUp className={isLanding ? "size-5" : "size-3.5"} />
              </Button>
            )}
          </div>
        </div>

        <p
          className={cn(
            "text-muted-foreground/70 text-center hidden sm:block",
            isLanding ? "text-xs mt-3" : "text-[11px] mt-2"
          )}
        >
          <kbd className="px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-mono border border-border/40">
            Enter
          </kbd>{" "}
          to send{" "}
          <span className="text-border mx-1">&middot;</span>{" "}
          <kbd className="px-1.5 py-0.5 rounded-md bg-muted/60 text-[10px] font-mono border border-border/40">
            Shift+Enter
          </kbd>{" "}
          for new line{" "}
          <span className="text-border mx-1">&middot;</span>{" "}
          {isGateway ? "Images will be OCR'd for text" : "Drop images or audio"}
        </p>
      </div>
    </div>
  );
}
