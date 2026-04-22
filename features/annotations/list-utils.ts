import type { AnnotationType, AnnotationWithTags } from "./types"

export interface AnnotationListFilters {
  search: string
  filterType: AnnotationType | ""
  filterColor: string
  filterTag: string
  hasCommentOnly: boolean
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
    filterColor,
    filterTag,
    hasCommentOnly,
  }: AnnotationListFilters
) {
  return annotations.filter((annotation) => {
    if (filterType && annotation.type !== filterType) {
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

    return (
      quotedText.includes(query) ||
      comment.includes(query) ||
      tags.includes(query)
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
