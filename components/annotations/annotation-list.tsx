"use client"

import { useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import {
  Filter,
  Search,
} from "lucide-react"

import type {
  AnnotationStatus,
  AnnotationType,
  AnnotationWithTags,
} from "@/features/annotations/types"
import { useListByDocumentQuery } from "@/features/annotations/api"
import { useGetDocumentViewerDataQuery } from "@/features/viewer/api"
import {
  buildAnnotationListRows,
  filterAnnotations,
} from "@/features/annotations/list-utils"
import { useViewer } from "@/features/viewer/provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useAppSelector } from "@/store/hooks"

const FILTER_TYPES: Array<{ value: AnnotationType; label: string }> = [
  { value: "HIGHLIGHT", label: "Highlight" },
  { value: "UNDERLINE", label: "Underline" },
  { value: "NOTE", label: "Note" },
  { value: "FREEHAND", label: "Pen" },
  { value: "TEXTBOX", label: "Text" },
]

const FILTER_STATUSES: Array<{ value: AnnotationStatus; label: string }> = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
]

const OWNERSHIP_FILTERS = [
  { value: "all", label: "Everyone" },
  { value: "mine", label: "Mine" },
  { value: "assigned", label: "Assigned to me" },
  { value: "shared", label: "Shared with me" },
] as const

function getStatusTone(status: AnnotationStatus) {
  switch (status) {
    case "OPEN":
      return "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "IN_PROGRESS":
      return "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300"
    case "RESOLVED":
      return "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  }
}

function formatStatus(status: AnnotationStatus) {
  switch (status) {
    case "IN_PROGRESS":
      return "In progress"
    case "RESOLVED":
      return "Resolved"
    default:
      return "Open"
  }
}

function getInitials(name: string | null | undefined, email: string | null | undefined) {
  const source = (name || email || "?").trim()
  return source.slice(0, 2).toUpperCase()
}

interface AnnotationListProps {
  documentId: string
}

function getExcerpt(annotation: AnnotationWithTags) {
  if (annotation.positionData.kind === "TEXT") {
    return annotation.positionData.anchor.quotedText.slice(0, 80)
  }

  return annotation.content?.slice(0, 80) ?? ""
}

export function AnnotationList({ documentId }: AnnotationListProps) {
  const { data: annotations = [], isLoading } = useListByDocumentQuery(documentId)
  const { data: viewerData } = useGetDocumentViewerDataQuery(documentId)
  const currentUser = useAppSelector((state) => state.auth.user)
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<AnnotationType | "">("")
  const [filterStatus, setFilterStatus] = useState<AnnotationStatus | "">("")
  const [filterColor, setFilterColor] = useState<string>("")
  const [filterTag, setFilterTag] = useState<string>("")
  const [filterAssignee, setFilterAssignee] = useState<string>("")
  const [filterOwnership, setFilterOwnership] =
    useState<(typeof OWNERSHIP_FILTERS)[number]["value"]>("all")
  const [hasCommentOnly, setHasCommentOnly] = useState(false)

  const openAnnotation = useViewer((state) => state.openAnnotation)
  const setPage = useViewer((state) => state.setPage)
  const selectedAnnotationId = useViewer((state) => state.rightPanelAnnotationId)
  const orphanedAnnotationIds = useViewer((state) => state.orphanedAnnotationIds)

  const availableColors = useMemo(
    () => Array.from(new Set(annotations.map((annotation) => annotation.color))),
    [annotations]
  )

  const availableTags = useMemo(
    () =>
      Array.from(
        new Map(
          annotations.flatMap((annotation) =>
            annotation.tags.map((tag) => [tag.id, tag] as const)
          )
        ).values()
      ),
    [annotations]
  )

  const availableAssignees = useMemo(
    () => (viewerData?.collaborators ?? []).filter((collaborator) => collaborator.role !== "VIEWER"),
    [viewerData]
  )

  const statusCounts = useMemo(
    () =>
      FILTER_STATUSES.map((status) => ({
        ...status,
        count: annotations.filter((annotation) => annotation.status === status.value).length,
      })),
    [annotations]
  )

  const filtered = useMemo(() => {
    return filterAnnotations(annotations, {
      search,
      filterType,
      filterStatus,
      filterColor,
      filterTag,
      filterAssignee,
      filterOwnership,
      hasCommentOnly,
      currentUserId: currentUser?.id,
    })
  }, [
    annotations,
    currentUser?.id,
    filterAssignee,
    filterColor,
    filterOwnership,
    filterStatus,
    filterTag,
    filterType,
    hasCommentOnly,
    search,
  ])

  const rows = useMemo(() => buildAnnotationListRows(filtered), [filtered])

  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => (rows[index]?.kind === "header" ? 30 : 84),
    overscan: 8,
  })

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-2 border-b border-border/50 p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search annotations..."
            className="h-8 pl-6 text-xs"
            aria-label="Search annotations"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          {OWNERSHIP_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setFilterOwnership(filter.value)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                filterOwnership === filter.value
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setFilterType("")}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              filterType === ""
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            All types
          </button>
          {FILTER_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() =>
                setFilterType((current) =>
                  current === type.value ? "" : type.value
                )
              }
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                filterType === type.value
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {type.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHasCommentOnly((current) => !current)}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
              hasCommentOnly
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            Has comment
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {statusCounts.map((status) => (
            <button
              key={status.value}
              type="button"
              onClick={() =>
                setFilterStatus((current) => (current === status.value ? "" : status.value))
              }
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors",
                filterStatus === status.value
                  ? getStatusTone(status.value)
                  : "border-border/60 bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              <span>{status.label}</span>
              <span className="text-[9px] opacity-70">{status.count}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Color
            </span>
            <select
              value={filterColor}
              onChange={(event) => setFilterColor(event.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by annotation color"
            >
              <option value="">All colors</option>
              {availableColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Tag
            </span>
            <select
              value={filterTag}
              onChange={(event) => setFilterTag(event.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by annotation tag"
            >
              <option value="">All tags</option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Assignee
            </span>
            <select
              value={filterAssignee}
              onChange={(event) => setFilterAssignee(event.target.value)}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by assignee"
            >
              <option value="">Anyone</option>
              {availableAssignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name || assignee.email || "Unknown user"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Status
            </span>
            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value as AnnotationStatus | "")}
              className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Filter by annotation status"
            >
              <option value="">All statuses</option>
              {FILTER_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      ) : null}

      {!isLoading && filtered.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <Filter className="size-8 text-muted-foreground/40" />
          <p className="text-xs text-muted-foreground">
            {annotations.length === 0
              ? "No annotations yet. Pick a tool to start marking up the page."
              : "No annotations match your filters."}
          </p>
        </div>
      ) : null}

      {!isLoading && filtered.length > 0 ? (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div
            className="relative"
            style={{ height: `${virtualizer.getTotalSize()}px` }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index]
              if (!row) {
                return null
              }

              if (row.kind === "header") {
                return (
                  <div
                    key={row.id}
                    className="absolute left-0 top-0 w-full px-2 py-2"
                    style={{ transform: `translateY(${virtualRow.start}px)` }}
                  >
                    <p className="px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Page {row.pageNumber} · {row.count}
                    </p>
                  </div>
                )
              }

              const annotation = row.annotation
              const isSelected = annotation.id === selectedAnnotationId
              const excerpt = getExcerpt(annotation)

              return (
                <div
                  key={row.id}
                  className="absolute left-0 top-0 w-full px-2 pb-1"
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setPage(annotation.pageNumber)
                      openAnnotation(annotation.id)
                    }}
                    className={cn(
                      "w-full rounded-lg px-2 py-2 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isSelected
                        ? "bg-primary/10 ring-1 ring-primary/30"
                        : "hover:bg-accent"
                    )}
                  >
                    <div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex size-2.5 rounded-full"
                            style={{ backgroundColor: annotation.color }}
                          />
                          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                            {annotation.type}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn("ml-auto border text-[9px]", getStatusTone(annotation.status))}
                          >
                            {formatStatus(annotation.status)}
                          </Badge>
                        </div>
                        {excerpt ? (
                          <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                            {excerpt}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs italic text-muted-foreground">
                            No text
                          </p>
                        )}
                        {orphanedAnnotationIds[annotation.id] ? (
                          <p className="mt-1 text-[10px] font-medium text-amber-600 dark:text-amber-400">
                            Needs relocation
                          </p>
                        ) : null}
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Avatar size="sm">
                              <AvatarImage
                                src={annotation.author?.image ?? undefined}
                                alt={annotation.author?.name ?? "Author"}
                              />
                              <AvatarFallback>
                                {getInitials(annotation.author?.name, annotation.author?.email)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate">
                              {annotation.author?.id === currentUser?.id
                                ? "You"
                                : annotation.author?.name || annotation.author?.email || "Unknown"}
                            </span>
                          </div>
                          {annotation.assignee ? (
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="text-[9px] uppercase tracking-wide opacity-70">
                                to
                              </span>
                              <Avatar size="sm">
                                <AvatarImage
                                  src={annotation.assignee.image ?? undefined}
                                  alt={annotation.assignee.name ?? "Assignee"}
                                />
                                <AvatarFallback>
                                  {getInitials(annotation.assignee.name, annotation.assignee.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {annotation.assignee.id === currentUser?.id
                                  ? "You"
                                  : annotation.assignee.name || annotation.assignee.email || "Unknown"}
                              </span>
                            </div>
                          ) : null}
                        </div>
                        {annotation.tags.length > 0 ? (
                          <div className="mt-1.5 flex flex-wrap gap-0.5">
                            {annotation.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag.id}
                                className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary"
                              >
                                {tag.label}
                              </span>
                            ))}
                            {annotation.tags.length > 3 ? (
                              <span className="text-[9px] text-muted-foreground">
                                +{annotation.tags.length - 3}
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
