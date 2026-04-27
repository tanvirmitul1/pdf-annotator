import { performance } from "node:perf_hooks"
import { describe, expect, it } from "vitest"

import {
  buildAnnotationListRows,
  filterAnnotations,
} from "@/features/annotations/list-utils"
import type { AnnotationWithTags } from "@/features/annotations/types"

function makeAnnotations(count: number, pageNumber = 1): AnnotationWithTags[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `annotation-${index + 1}`,
    userId: "user-1",
    documentId: "doc-1",
    pageNumber,
    type: "HIGHLIGHT",
    status: "OPEN",
    color: index % 2 === 0 ? "#fbbf24" : "#60a5fa",
    positionData: {
      kind: "TEXT",
      pageNumber,
      anchor: {
        rects: [{ x: index, y: index + 1, width: 30, height: 10 }],
        quotedText: `Quoted text ${index + 1}`,
        prefix: "",
        suffix: "",
      },
    },
    content: index % 3 === 0 ? `Comment ${index + 1}` : null,
    deletedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags:
      index % 5 === 0
        ? [{ id: `tag-${index + 1}`, label: "review", color: null }]
        : [],
  }))
}

function measureListPreparation(count: number) {
  const annotations = makeAnnotations(count)
  const start = performance.now()
  const filtered = filterAnnotations(annotations, {
    search: "",
    filterType: "",
    filterColor: "",
    filterTag: "",
    hasCommentOnly: false,
  })
  const rows = buildAnnotationListRows(filtered)
  const duration = performance.now() - start

  return { duration, rowCount: rows.length }
}

describe("annotation list performance", () => {
  it("prepares 50 annotations within the 5ms budget", () => {
    const { duration, rowCount } = measureListPreparation(50)

    expect(rowCount).toBe(51)
    expect(duration).toBeLessThan(5)
  })

  it("prepares 500 annotations within the 16ms budget", () => {
    const { duration, rowCount } = measureListPreparation(500)

    expect(rowCount).toBe(501)
    expect(duration).toBeLessThan(16)
  })
})
