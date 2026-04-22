import { describe, expect, it } from "vitest"

import { resolveTextAnchor } from "@/features/annotations/reanchor"

describe("resolveTextAnchor", () => {
  it("reanchors text to the matching segments", () => {
    const result = resolveTextAnchor(
      [
        {
          text: "Hello ",
          rect: { x: 10, y: 20, width: 30, height: 10 },
        },
        {
          text: "world",
          rect: { x: 42, y: 20, width: 26, height: 10 },
        },
      ],
      {
        quotedText: "Hello world",
        prefix: "",
        suffix: "",
        rects: [{ x: 0, y: 0, width: 1, height: 1 }],
      }
    )

    expect(result.orphaned).toBe(false)
    expect(result.rects).toHaveLength(2)
    expect(result.rects[0]).toEqual({ x: 10, y: 20, width: 30, height: 10 })
  })

  it("falls back to orphaned when the quoted text is gone", () => {
    const fallbackRect = { x: 4, y: 5, width: 6, height: 7 }
    const result = resolveTextAnchor(
      [
        {
          text: "Another page",
          rect: { x: 20, y: 20, width: 30, height: 10 },
        },
      ],
      {
        quotedText: "Missing text",
        prefix: "",
        suffix: "",
        rects: [fallbackRect],
      }
    )

    expect(result.orphaned).toBe(true)
    expect(result.rects).toEqual([fallbackRect])
  })

  it("uses prefix and suffix when several similar matches exist", () => {
    const result = resolveTextAnchor(
      [
        {
          text: "alpha beta gamma ",
          rect: { x: 10, y: 20, width: 60, height: 10 },
        },
        {
          text: "beta",
          rect: { x: 80, y: 20, width: 20, height: 10 },
        },
        {
          text: " delta",
          rect: { x: 102, y: 20, width: 24, height: 10 },
        },
      ],
      {
        quotedText: "beta",
        prefix: "gamma",
        suffix: "delta",
        rects: [{ x: 0, y: 0, width: 1, height: 1 }],
      }
    )

    expect(result.orphaned).toBe(false)
    expect(result.rects).toEqual([{ x: 80, y: 20, width: 20, height: 10 }])
  })
})
