import type {
  AnnotationStatus,
  AnnotationType,
  AnnotationWithTags,
} from "./types"

export interface AnnotationListFilters {
  search: string
  filterType: AnnotationType | ""
  filterStatus: AnnotationStatus | ""
  filterColor: string
  filterTag: string
  filterAssignee: string
  filterOwnership: "all" | "mine" | "shared" | "assigned"
  hasCommentOnly: boolean
  currentUserId?: string
}

export type AnnotationListRow =
  | {
      kind: "header"
      id: string
      pageNumber: number
      count: number
    }
  | {
      kind: "annotation"
      id: string
      annotation: AnnotationWithTags
    }

export function filterAnnotations(
  annotations: AnnotationWithTags[],
  {
    search,
    filterType,
    filterStatus,
    filterColor,
    filterTag,
    filterAssignee,
    filterOwnership,
    hasCommentOnly,
    currentUserId,
  }: AnnotationListFilters
) {
  return annotations.filter((annotation) => {
    if (filterType && annotation.type !== filterType) {
      return false
    }

    if (filterStatus && annotation.status !== filterStatus) {
      return false
    }

    if (filterColor && annotation.color !== filterColor) {
      return false
    }

    if (
      filterTag &&
      !annotation.tags.some((tag) => tag.id === filterTag || tag.label === filterTag)
    ) {
      return false
    }

    if (hasCommentOnly && !annotation.content) {
      return false
    }

    if (filterAssignee && annotation.assignee?.id !== filterAssignee) {
      return false
    }

    if (currentUserId) {
      const isMine =
        annotation.author?.id === currentUserId || annotation.userId === currentUserId
      const isAssignedToMe = annotation.assignee?.id === currentUserId

      if (filterOwnership === "mine" && !isMine) {
        return false
      }

      if (filterOwnership === "shared" && isMine) {
        return false
      }

      if (filterOwnership === "assigned" && !isAssignedToMe) {
        return false
      }
    }

    if (!search.trim()) {
      return true
    }

    const query = search.toLowerCase()
    const quotedText =
      annotation.positionData.kind === "TEXT"
        ? annotation.positionData.anchor.quotedText.toLowerCase()
        : ""
    const comment = annotation.content?.toLowerCase() ?? ""
    const tags = annotation.tags.map((tag) => tag.label.toLowerCase()).join(" ")
    const author = `${annotation.author?.name ?? ""} ${annotation.author?.email ?? ""}`.toLowerCase()
    const assignee = `${annotation.assignee?.name ?? ""} ${annotation.assignee?.email ?? ""}`.toLowerCase()
    const status = annotation.status.toLowerCase().replaceAll("_", " ")

    return (
      quotedText.includes(query) ||
      comment.includes(query) ||
      tags.includes(query) ||
      author.includes(query) ||
      assignee.includes(query) ||
      status.includes(query)
    )
  })
}

export function buildAnnotationListRows(
  annotations: AnnotationWithTags[]
): AnnotationListRow[] {
  const grouped = new Map<number, AnnotationWithTags[]>()

  annotations.forEach((annotation) => {
    const existing = grouped.get(annotation.pageNumber) ?? []
    existing.push(annotation)
    grouped.set(annotation.pageNumber, existing)
  })

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left - right)
    .flatMap(([pageNumber, items]) => [
      {
        kind: "header" as const,
        id: `header-${pageNumber}`,
        pageNumber,
        count: items.length,
      },
      ...items.map((annotation) => ({
        kind: "annotation" as const,
        id: annotation.id,
        annotation,
      })),
    ])
}
