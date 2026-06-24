"use client";

import {
  Bot,
  Code2,
  FileText,
  Menu,
  MessageSquare,
  X,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  onOpenMobileSidebar?: () => void;
  onEditMessage?: (text: string) => void;
}

const SUGGESTION_CHIPS = [
  { icon: Code2, label: "Write code", prompt: "Write a Python script that " },
  { icon: FileText, label: "Create a document", prompt: "Create a PDF document about " },
  { icon: MessageSquare, label: "Explain something", prompt: "Explain how " },
  { icon: Zap, label: "Analyze an image", prompt: "Analyze this image and " },
];

const chipContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.3 } },
};

const chipItemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

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
  messagesEndRef,
  textareaRef,
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
  onOpenMobileSidebar,
  onEditMessage,
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
      {/* Mobile header with hamburger */}
      {onOpenMobileSidebar && (
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border/50 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileSidebar}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <MessageSquare className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-foreground">Chat</span>
          </div>
        </div>
      )}

      {/* Landing layout: empty state + big input centered */}
      {isEmpty ? (
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col items-center text-center mb-8"
          >
            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 shadow-lg">
              <Bot className="size-7 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2 tracking-tight">
              What can I help you with?
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Write code, generate documents, analyze images, or just chat.
            </p>
          </motion.div>

          {/* Big centered input */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="w-full max-w-2xl"
          >
            {inputNode}
          </motion.div>

          {/* Suggestion chips below input */}
          <motion.div
            variants={chipContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-wrap gap-2 justify-center max-w-lg mt-6"
          >
            {SUGGESTION_CHIPS.map((chip) => (
              <motion.button
                key={chip.label}
                variants={chipItemVariants}
                whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onInputChange(chip.prompt);
                  textareaRef.current?.focus();
                }}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium",
                  "border border-border/60 bg-card/60 text-muted-foreground",
                  "hover:text-foreground hover:border-primary/30",
                  "transition-colors duration-150",
                  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                )}
              >
                <chip.icon className="size-3.5 text-primary/70" />
                {chip.label}
              </motion.button>
            ))}
          </motion.div>
        </div>
      ) : (
        <>
          {/* Conversation layout: messages + compact input at bottom */}
          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
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
                    onEditMessage={onEditMessage}
                  />
                );
              })}

              {isLoading && <TypingIndicator />}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mx-4 mb-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between shrink-0"
              >
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Compact bottom input */}
          {inputNode}
        </>
      )}
    </div>
  );
}
