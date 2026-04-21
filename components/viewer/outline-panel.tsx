"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, BookOpen } from "lucide-react"

import { useViewer } from "@/features/viewer/provider"
import { cn } from "@/lib/utils"
import type { DocumentOutlineEntry } from "@/features/viewer/api"

interface OutlinePanelProps {
  outline: DocumentOutlineEntry[] | null
}

export function OutlinePanel({ outline }: OutlinePanelProps) {
  if (!outline || outline.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center">
        <BookOpen className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          This document has no outline
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto py-2">
      <OutlineTree entries={outline} depth={0} />
    </div>
  )
}

function OutlineTree({
  entries,
  depth,
}: {
  entries: DocumentOutlineEntry[]
  depth: number
}) {
  return (
    <ul role="tree">
      {entries.map((entry, i) => (
        <OutlineItem key={i} entry={entry} depth={depth} />
      ))}
    </ul>
  )
}

function OutlineItem({
  entry,
  depth,
}: {
  entry: DocumentOutlineEntry
  depth: number
}) {
  const setPage = useViewer((s) => s.setPage)
  const [expanded, setExpanded] = useState(depth === 0)
  const hasChildren = entry.items && entry.items.length > 0

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={false}
    >
      <button
        type="button"
        onClick={() => {
          if (entry.pageNumber) setPage(entry.pageNumber)
          if (hasChildren) setExpanded((v) => !v)
        }}
        className={cn(
          "flex w-full cursor-pointer items-center gap-1 rounded px-2 py-1 text-left text-sm transition-colors",
          "hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none",
          "active:bg-accent/80"
        )}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        aria-label={`Go to ${entry.title}`}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="size-3 shrink-0" />
        )}
        <span className="truncate">{entry.title}</span>
        {entry.pageNumber && (
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {entry.pageNumber}
          </span>
        )}
      </button>
      {hasChildren && expanded && (
        <OutlineTree entries={entry.items} depth={depth + 1} />
      )}
    </li>
  )
}
