"use client";

import { useCallback, useState, type ReactNode } from "react";
import { AudioLines, Bot, ChevronRight, User, X, Copy, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
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
    // Inline code
    return (
      <code className="text-[13px] font-mono bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
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
    <div className="relative group/code my-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-[#1d1f21]">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {displayLang || "CODE"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700"
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

/* ── Custom markdown components for ChatGPT/Claude-like styling ── */
const markdownComponents: Components = {
  // Code blocks and inline code
  code: CodeBlock as Components["code"],
  pre: ({ children }) => <>{children}</>,

  // Paragraphs
  p: ({ children }) => (
    <p className="text-[15px] leading-7 text-slate-700 dark:text-slate-300 my-3 first:mt-0 last:mb-0">
      {children}
    </p>
  ),

  // Headings
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 first:mt-0 pb-2 border-b border-slate-200 dark:border-slate-700">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2.5 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-4 mb-2 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-3 mb-1.5 first:mt-0 uppercase tracking-wide">
      {children}
    </h4>
  ),

  // Unordered lists
  ul: ({ children }) => (
    <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-blue-500 dark:marker:text-blue-400">
      {children}
    </ul>
  ),
  // Ordered lists
  ol: ({ children, start }) => (
    <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-blue-600 marker:font-semibold dark:marker:text-blue-400" start={start}>
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-[15px] leading-7 text-slate-700 dark:text-slate-300 pl-1.5">
      {children}
    </li>
  ),

  // Blockquotes
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/30 pl-4 pr-3 py-2 rounded-r-lg text-slate-600 dark:text-slate-400 italic">
      {children}
    </blockquote>
  ),

  // Links
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 dark:text-blue-400 font-medium underline decoration-blue-300 dark:decoration-blue-700 underline-offset-2 hover:decoration-blue-500 dark:hover:decoration-blue-400 transition-colors"
    >
      {children}
    </a>
  ),

  // Tables
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      {children}
    </thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
      {children}
    </tbody>
  ),
  tr: ({ children }) => (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children }) => (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
      {children}
    </td>
  ),

  // Horizontal rule
  hr: () => (
    <hr className="my-6 border-slate-200 dark:border-slate-700" />
  ),

  // Strong / Bold
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900 dark:text-white">
      {children}
    </strong>
  ),

  // Emphasis / Italic
  em: ({ children }) => (
    <em className="italic text-slate-600 dark:text-slate-400">
      {children}
    </em>
  ),
};

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
                  <div className="text-base leading-8 whitespace-pre-wrap break-words">
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
              {artifacts.map((artifact) => {
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
