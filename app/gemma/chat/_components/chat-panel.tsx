"use client";

import {
  Bot,
  Code2,
  FileText,
  MessageSquare,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Artifact, ChatAttachment, ChatMessage } from "../_lib/types";
import { parseArtifacts } from "../_lib/artifact-parser";
import { MessageBubble } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { ChatInput } from "./chat-input";

type GemmaBackend = "local" | "gateway-api";

interface ChatPanelProps {
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (attachments?: ChatAttachment[], hasOcrPending?: boolean) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isLoading: boolean;
  onStop: () => void;
  error: string | null;
  onDismissError: () => void;
  onArtifactClick: (artifact: Artifact) => void;
  hasArtifacts: boolean;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  showPanel: boolean;
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
  backend: GemmaBackend;
  onBackendChange: (backend: GemmaBackend) => void;
  hasOcrPending: boolean;
  isSidebarCollapsed?: boolean;
}

const SUGGESTION_CHIPS = [
  { icon: Code2, label: "Write code", prompt: "Write a Python script that " },
  { icon: FileText, label: "Create a document", prompt: "Create a PDF document about " },
  { icon: MessageSquare, label: "Explain something", prompt: "Explain how " },
  { icon: Zap, label: "Analyze an image", prompt: "Analyze this image and " },
];

export function ChatPanel({
  messages,
  input,
  onInputChange,
  onSubmit,
  onKeyDown,
  isLoading,
  onStop,
  error,
  onDismissError,
  onArtifactClick,
  hasArtifacts,
  isPanelOpen,
  onTogglePanel,
  messagesEndRef,
  textareaRef,
  showPanel,
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
  backend,
  onBackendChange,
  hasOcrPending,
  isSidebarCollapsed,
}: ChatPanelProps) {
  const isEmpty = messages.length === 0 && !isLoading;
  const isGateway = backend === "gateway-api";

  const inputNode = (
    <ChatInput
      input={input}
      onInputChange={onInputChange}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      isLoading={isLoading}
      onStop={onStop}
      textareaRef={textareaRef}
      variant={isEmpty ? "landing" : "compact"}
      attachments={attachments}
      ocrLoading={ocrLoading}
      ocrProgress={ocrProgress}
      ocrErrors={ocrErrors}
      onAddFiles={onAddFiles}
      onRemoveAttachment={onRemoveAttachment}
      onRunOcr={onRunOcr}
      onRetryOcr={onRetryOcr}
      onCancelOcr={onCancelOcr}
      onClearAttachments={onClearAttachments}
      isListening={isListening}
      isSpeechSupported={isSpeechSupported}
      onToggleSpeech={onToggleSpeech}
      isGateway={isGateway}
      hasOcrPending={hasOcrPending}
      backend={backend}
      onBackendChange={onBackendChange}
    />
  );

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Landing layout: empty state + big input centered */}
      {isEmpty ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center text-center animate-message-in mb-8">
            {/* Gradient bot icon */}
            <div className="size-16 rounded-2xl gemma-gradient flex items-center justify-center mb-6 gemma-shadow-lg animate-float">
              <Bot className="size-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              What can I help you with?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Write code, generate documents, analyze images, or just chat.
            </p>
          </div>

          {/* Big centered input */}
          <div className="w-full max-w-2xl animate-message-in" style={{ animationDelay: "100ms" }}>
            {inputNode}
          </div>

          {/* Suggestion chips below input */}
          <div
            className="flex flex-wrap gap-2 justify-center max-w-lg mt-6 animate-message-in"
            style={{ animationDelay: "200ms" }}
          >
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => {
                  onInputChange(chip.prompt);
                  textareaRef.current?.focus();
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium",
                  "border border-border/60 bg-card/50 text-muted-foreground",
                  "hover:bg-primary/5 hover:border-primary/30 hover:text-foreground",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                )}
              >
                <chip.icon className="size-3.5 text-primary/70" />
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* ── Conversation layout: messages + compact input at bottom ── */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
              {messages.map((message, index) => {
                const artifacts =
                  message.role === "assistant"
                    ? parseArtifacts(message.text)
                    : [];
                return (
                  <MessageBubble
                    key={index}
                    message={message}
                    artifacts={artifacts}
                    onArtifactClick={onArtifactClick}
                    index={index}
                  />
                );
              })}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mx-4 mb-2 px-3.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between shrink-0 animate-message-in gemma-shadow">
              <span className="truncate mr-2 font-medium">{error}</span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={onDismissError}
                aria-label="Dismiss error"
                className="hover:bg-destructive/10"
              >
                <X className="size-3" />
              </Button>
            </div>
          )}

          {/* Compact bottom input */}
          {inputNode}
        </>
      )}
    </div>
  );
}
