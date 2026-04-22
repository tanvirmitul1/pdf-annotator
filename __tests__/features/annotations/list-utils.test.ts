import { describe, expect, it } from "vitest"

import {
  buildAnnotationListRows,
  filterAnnotations,
} from "@/features/annotations/list-utils"
import type { AnnotationWithTags } from "@/features/annotations/types"

function makeAnnotation(
  id: string,
  overrides: Partial<AnnotationWithTags> = {}
): AnnotationWithTags {
  return {
    id,
    userId: "user-1",
    documentId: "doc-1",
    pageNumber: 1,
    type: "HIGHLIGHT",
    color: "#fbbf24",
    positionData: {
      kind: "TEXT",
      pageNumber: 1,
      anchor: {
        rects: [{ x: 1, y: 2, width: 30, height: 10 }],
        quotedText: "Important quote",
        prefix: "",
        suffix: "",
      },
    },
    content: null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    ...overrides,
  }
}

describe("annotation list utils", () => {
  it("filters by type, color, tag, comment, and search text", () => {
    const annotations = [
      makeAnnotation("annotation-1", {
        type: "HIGHLIGHT",
        color: "#fbbf24",
        content: "Needs follow-up",
        tags: [{ id: "tag-1", label: "review", color: null }],
      }),
      makeAnnotation("annotation-2", {
        type: "NOTE",
        color: "#60a5fa",
        content: "Check later",
        tags: [{ id: "tag-2", label: "todo", color: null }],
      }),
    ]

    const filtered = filterAnnotations(annotations, {
      search: "review",
      filterType: "HIGHLIGHT",
      filterColor: "#fbbf24",
      filterTag: "tag-1",
      hasCommentOnly: true,
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0]?.id).toBe("annotation-1")
  })

  it("builds grouped rows ordered by page number", () => {
    const rows = buildAnnotationListRows([
      makeAnnotation("annotation-3", { pageNumber: 2 }),
      makeAnnotation("annotation-1", { pageNumber: 1 }),
      makeAnnotation("annotation-2", { pageNumber: 1 }),
    ])

    expect(rows[0]).toMatchObject({ kind: "header", pageNumber: 1, count: 2 })
    expect(rows[1]).toMatchObject({ kind: "annotation", id: "annotation-1" })
    expect(rows[2]).toMatchObject({ kind: "annotation", id: "annotation-2" })
    expect(rows[3]).toMatchObject({ kind: "header", pageNumber: 2, count: 1 })
    expect(rows[4]).toMatchObject({ kind: "annotation", id: "annotation-3" })
  })
})
