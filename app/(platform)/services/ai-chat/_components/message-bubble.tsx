"use client";

import { useCallback, useState, type ReactNode } from "react";
import { AudioLines, Bot, ChevronRight, User, X, Copy, Edit2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Artifact, ChatMessage } from "../_lib/types";
import { stripArtifacts } from "../_lib/artifact-parser";
import { getArtifactIcon } from "../_lib/icons";
import { CodeHighlight } from "./code-highlight";

/* ── Code block with language label + copy button ── */
function CodeBlock({ className, children }: { className?: string; children?: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const lang = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  if (!match) {
    return (
      <code className="text-[13px] font-mono bg-muted px-1.5 py-0.5 rounded-md text-primary border border-border/50">
        {children}
      </code>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLang = lang.toUpperCase();

  return (
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-border/50 bg-muted">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/80 border-b border-border/50">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          {displayLang || "CODE"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <CodeHighlight code={code} language={lang} className="rounded-none! border-0!" />
    </div>
  );
}

/* ── Custom markdown components ── */
const markdownComponents: Components = {
  code: CodeBlock as Components["code"],
  pre: ({ children }) => <>{children}</>,

  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-foreground/80 my-3 first:mt-0 last:mb-0">
      {children}
    </p>
  ),

  h1: ({ children }) => (
    <h1 className="text-xl font-semibold text-foreground mt-6 mb-3 first:mt-0 pb-2 border-b border-border/50 tracking-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-foreground mt-5 mb-2.5 first:mt-0 tracking-tight">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-foreground mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-foreground mt-3 mb-1.5 first:mt-0 uppercase tracking-wide">
      {children}
    </h4>
  ),

  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-primary/60">
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-primary marker:font-semibold" start={start}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-7 text-foreground/80 pl-1.5">
      {children}
    </li>
  ),

  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-primary/40 bg-primary/5 pl-4 pr-3 py-2 rounded-r-lg text-muted-foreground italic">
      {children}
    </blockquote>
  ),

  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary font-medium underline decoration-primary/30 underline-offset-2 hover:decoration-primary transition-colors"
    >
      {children}
    </a>
  ),

  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/50 border-b border-border/50">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border/30">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-foreground/80">
      {children}
    </td>
  ),

  hr: () => (
    <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6" />
  ),

  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">
      {children}
    </strong>
  ),

  em: ({ children }) => (
    <em className="italic text-muted-foreground">
      {children}
    </em>
  ),
};

interface MessageBubbleProps {
  message: ChatMessage;
  artifacts: Artifact[];
  onArtifactClick: (artifact: Artifact) => void;
  onEditMessage?: (text: string) => void;
  index?: number;
}

export function MessageBubble({
  message,
  artifacts,
  onArtifactClick,
  onEditMessage,
  index = 0,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const cleanText = isUser ? message.text : stripArtifacts(message.text);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImageClick = useCallback((src: string) => {
    setExpandedImage(src);
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedImage(null);
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [cleanText]);

  const handleEdit = useCallback(() => {
    if (onEditMessage && cleanText) {
      onEditMessage(cleanText);
    }
  }, [onEditMessage, cleanText]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        ease: [0.25, 0.1, 0.25, 1],
        delay: Math.min(index * 0.05, 0.3),
      }}
      className="flex gap-4 w-full group"
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="shrink-0 size-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
          <Bot className="size-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          "min-w-0 flex-1",
          isUser && "flex justify-end"
        )}
      >
        <div className={cn(
          "space-y-3",
          isUser ? "max-w-[75%]" : "max-w-full"
        )}>
          {/* Attachments on user messages */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex gap-2 justify-end flex-wrap">
              {message.attachments.map((att) =>
                att.kind === "audio" ? (
                  <div
                    key={att.id}
                    className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20 min-w-44 max-w-56"
                  >
                    <div className="flex items-center gap-2">
                      <AudioLines className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs text-primary truncate flex-1">
                        {att.fileName}
                      </span>
                    </div>
                    <audio
                      src={att.preview || `data:${att.mimeType};base64,${att.base64}`}
                      controls
                      preload="metadata"
                      className="w-full h-8 rounded-lg"
                    />
                  </div>
                ) : (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => {
                      const imgSrc = att.preview || `data:${att.mimeType};base64,${att.base64}`;
                      handleImageClick(imgSrc);
                    }}
                    className="cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none rounded-xl"
                    aria-label={`View ${att.fileName} full size`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.preview || `data:${att.mimeType};base64,${att.base64}`}
                      alt={att.fileName}
                      className="w-24 h-24 rounded-xl object-cover border border-border/50 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                    />
                  </button>
                )
              )}
            </div>
          )}

          {cleanText && (
            <div className="relative group/message">
              <div
                className={cn(
                  isUser
                    ? "rounded-2xl rounded-br-md px-4 py-3 bg-primary text-primary-foreground shadow-sm ml-auto w-fit"
                    : "w-full"
                )}
              >
                {isUser ? (
                  <div className="text-[15px] leading-7 whitespace-pre-wrap wrap-break-word">
                    {cleanText}
                  </div>
                ) : (
                  <div className="max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={markdownComponents}
                    >
                      {cleanText}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Action Buttons — below message */}
              <div className={cn(
                "flex gap-1 mt-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200",
                isUser ? "justify-end" : "justify-start"
              )}>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="size-3.5 text-green-600" />
                      <span className="text-green-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
                {isUser && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Inline artifact cards */}
          {!isUser && artifacts.length > 0 && (
            <div className="flex flex-col gap-2">
              {artifacts.map((artifact) => {
                const Icon = getArtifactIcon(artifact.type, artifact.title);
                return (
                  <button
                    key={artifact.identifier}
                    onClick={() => onArtifactClick(artifact)}
                    className={cn(
                      "flex items-center gap-3 w-full px-4 py-3 rounded-xl",
                      "bg-muted/30 border border-border/50",
                      "hover:bg-muted/50 hover:border-primary/30",
                      "transition-all duration-200 text-left group/artifact"
                    )}
                  >
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground block truncate">
                        {artifact.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Click to view &middot; {artifact.type}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover/artifact:text-primary group-hover/artifact:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="shrink-0 size-8 rounded-xl bg-muted flex items-center justify-center">
          <User className="size-4 text-muted-foreground" />
        </div>
      )}

      {/* Expanded image lightbox */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleCloseExpanded}
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCloseExpanded();
          }}
          role="button"
          tabIndex={0}
          aria-label="Close expanded image"
        >
          <button
            type="button"
            onClick={handleCloseExpanded}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={expandedImage}
            alt="Expanded view"
            className="max-w-[90vw] max-h-[90vh] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </motion.div>
  );
}
