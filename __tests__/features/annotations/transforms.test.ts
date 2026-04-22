import { describe, expect, it } from "vitest"

import { screenToSrc, srcToScreen } from "@/features/annotations/types"

const rotations = [0, 90, 180, 270] as const

describe("annotation coordinate transforms", () => {
  it.each(rotations)("round-trips points for rotation %s", (rotation) => {
    const source = { x: 84, y: 126 }
    const srcW = 612
    const srcH = 792
    const zoom = 2.25

    const screen = srcToScreen(source.x, source.y, srcW, srcH, zoom, rotation)
    const roundTrip = screenToSrc(screen.x, screen.y, srcW, srcH, zoom, rotation)

    expect(roundTrip.x).toBeCloseTo(source.x, 6)
    expect(roundTrip.y).toBeCloseTo(source.y, 6)
  })
})
