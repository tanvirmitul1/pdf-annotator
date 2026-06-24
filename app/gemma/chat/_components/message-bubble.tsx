"use client";

import { useCallback, useState } from "react";
import { AudioLines, Bot, ChevronRight, User, X, Copy, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import type { Artifact, ChatMessage } from "../_lib/types";
import { stripArtifacts } from "../_lib/artifact-parser";
import { getArtifactIcon } from "../_lib/icons";

interface MessageBubbleProps {
  message: ChatMessage;
  artifacts: Artifact[];
  onArtifactClick: (artifact: Artifact) => void;
  index?: number;
}

export function MessageBubble({
  message,
  artifacts,
  onArtifactClick,
  index = 0,
}: MessageBubbleProps) {
  const isUser = message.role === "user";
  const cleanText = isUser ? message.text : stripArtifacts(message.text);
  const delay = Math.min(index * 50, 300);
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
    // TODO: Implement edit functionality
    console.log("Edit message:", message);
  }, [message]);

  return (
    <div
      className="flex gap-4 w-full group"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Bot avatar */}
      {!isUser && (
        <div className="shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
          <Bot className="h-4 w-4 text-white" />
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
                    className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 min-w-44 max-w-56"
                  >
                    <div className="flex items-center gap-2">
                      <AudioLines className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span className="text-xs text-blue-700 dark:text-blue-300 truncate flex-1">
                        {att.fileName}
                      </span>
                    </div>
                    <audio
                      src={`data:${att.mimeType};base64,${att.base64}`}
                      controls
                      preload="metadata"
                      className="w-full h-8 rounded-lg"
                    />
                  </div>
                ) : (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() =>
                      handleImageClick(
                        `data:${att.mimeType};base64,${att.base64}`
                      )
                    }
                    className="cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none rounded-xl"
                    aria-label={`View ${att.fileName} full size`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:${att.mimeType};base64,${att.base64}`}
                      alt={att.fileName}
                      className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
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
                    ? "rounded-2xl px-4 py-3 bg-blue-600 text-white shadow-sm ml-auto w-fit"
                    : "w-full"
                )}
              >
                {isUser ? (
                  <div className="text-[15px] leading-[1.7] whitespace-pre-wrap break-words">
                    {cleanText}
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none dark:prose-invert
                    prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mt-6 first:prose-headings:mt-0 prose-headings:mb-3
                    prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base
                    prose-p:text-[15px] prose-p:leading-[1.7] prose-p:my-4 prose-p:text-slate-700 dark:prose-p:text-slate-300
                    first:prose-p:mt-0 last:prose-p:mb-0
                    prose-ul:my-4 prose-ul:space-y-2 prose-ol:my-4 prose-ol:space-y-2
                    prose-li:text-[15px] prose-li:leading-[1.7] prose-li:my-1 prose-li:text-slate-700 dark:prose-li:text-slate-300
                    prose-strong:font-semibold prose-strong:text-slate-900 dark:prose-strong:text-slate-100
                    prose-code:text-sm prose-code:bg-slate-100 dark:prose-code:bg-slate-800 
                    prose-code:text-slate-900 dark:prose-code:text-slate-100
                    prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono
                    prose-code:before:content-[''] prose-code:after:content-['']
                    prose-pre:my-4 prose-pre:bg-slate-50 dark:prose-pre:bg-slate-900 
                    prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-800 
                    prose-pre:rounded-xl prose-pre:p-4
                    prose-blockquote:my-4 prose-blockquote:border-l-blue-500 prose-blockquote:border-l-4 
                    prose-blockquote:pl-4 prose-blockquote:py-1 prose-blockquote:italic 
                    prose-blockquote:text-slate-600 dark:prose-blockquote:text-slate-400
                    prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-a:no-underline hover:prose-a:underline
                    prose-hr:my-6 prose-hr:border-slate-200 dark:prose-hr:border-slate-800
                    prose-table:my-4 prose-th:text-left prose-th:font-semibold prose-th:p-2 prose-td:p-2"
                  >
                    <ReactMarkdown>{cleanText}</ReactMarkdown>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className={cn(
                "absolute top-0 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity",
                isUser ? "right-full mr-2" : "left-full ml-2"
              )}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  )}
                </Button>
                {isUser && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                    onClick={handleEdit}
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Inline artifact cards */}
          {!isUser && artifacts.length > 0 && (
            <div className="flex flex-col gap-2">
              {artifacts.map((artifact, artIdx) => {
                const Icon = getArtifactIcon(artifact.type, artifact.title);
                return (
                  <button
                    key={artifact.identifier}
                    onClick={() => onArtifactClick(artifact)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-left group/artifact"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white block truncate">
                        {artifact.title}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        Click to view • {artifact.type}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover/artifact:text-blue-600 dark:group-hover/artifact:text-blue-400 group-hover/artifact:translate-x-0.5 transition-all shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="shrink-0 h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-sm">
          <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
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
    </div>
  );
}
