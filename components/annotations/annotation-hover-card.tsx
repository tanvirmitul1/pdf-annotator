"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Circle,
  Highlighter,
  MoveRight,
  Pencil,
  Square,
  StickyNote,
  Strikethrough,
  Type,
  Underline,
  Waves,
} from "lucide-react"

import type { AnnotationWithTags } from "@/features/annotations/types"

interface AnnotationHoverCardProps {
  annotation: AnnotationWithTags
  position: { x: number; y: number }
  orphaned?: boolean
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  HIGHLIGHT: <Highlighter className="size-3.5" />,
  UNDERLINE: <Underline className="size-3.5" />,
  STRIKETHROUGH: <Strikethrough className="size-3.5" />,
  SQUIGGLY: <Waves className="size-3.5" />,
  NOTE: <StickyNote className="size-3.5" />,
  FREEHAND: <Pencil className="size-3.5" />,
  RECTANGLE: <Square className="size-3.5" />,
  CIRCLE: <Circle className="size-3.5" />,
  ARROW: <MoveRight className="size-3.5" />,
  TEXTBOX: <Type className="size-3.5" />,
}

const TYPE_LABELS: Record<string, string> = {
  HIGHLIGHT: "Highlight",
  UNDERLINE: "Underline",
  STRIKETHROUGH: "Strikethrough",
  SQUIGGLY: "Squiggly",
  NOTE: "Note",
  FREEHAND: "Freehand",
  RECTANGLE: "Rectangle",
  CIRCLE: "Circle",
  ARROW: "Arrow",
  TEXTBOX: "Text box",
}

export function AnnotationHoverCard({
  annotation,
  position,
  orphaned = false,
}: AnnotationHoverCardProps) {
  const quotedText =
    annotation.positionData.kind === "TEXT"
      ? annotation.positionData.anchor.quotedText
      : ""
  const preview = (annotation.content || quotedText).slice(0, 120)
  const hasOverflow =
    preview.length < Math.max(annotation.content?.length ?? 0, quotedText.length)

  const visibleTags = annotation.tags.slice(0, 3)
  const extraTagCount = annotation.tags.length - visibleTags.length

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-50 w-64 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur-xl"
      style={{
        top: position.y,
        left: position.x,
        transform: "translate(8px, -50%)",
      }}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          {TYPE_ICONS[annotation.type]}
          {TYPE_LABELS[annotation.type] ?? annotation.type}
        </span>
        <span
          className="ml-auto size-2.5 rounded-full"
          style={{ backgroundColor: annotation.color }}
          aria-hidden
        />
      </div>

      {preview ? (
        <p className="mb-1.5 line-clamp-3 text-xs text-foreground/80">
          {hasOverflow ? `${preview}...` : preview}
        </p>
      ) : null}

      {visibleTags.length > 0 ? (
        <div className="mb-1.5 flex flex-wrap gap-1">
          {visibleTags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
            >
              {tag.label}
            </span>
          ))}
          {extraTagCount > 0 ? (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{extraTagCount}
            </span>
          ) : null}
        </div>
      ) : null}

      {orphaned ? (
        <p className="mb-1.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          Text changed on this page. Relocation is needed.
        </p>
      ) : null}

      <p className="text-[10px] text-muted-foreground/70">
        Created by you ·{" "}
        {formatDistanceToNow(new Date(annotation.createdAt), { addSuffix: true })}
      </p>
    </div>
  )
}
