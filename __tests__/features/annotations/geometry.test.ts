import { describe, expect, it } from "vitest"

import {
  resizePositionData,
  translatePositionData,
} from "@/features/annotations/geometry"
import type { PositionData } from "@/features/annotations/types"

describe("annotation geometry helpers", () => {
  it("translates rect annotations while preserving size", () => {
    const positionData: PositionData = {
      kind: "RECT",
      pageNumber: 1,
      x: 40,
      y: 60,
      width: 120,
      height: 80,
    }

    const next = translatePositionData(positionData, { x: 25, y: -10 }, 612, 792)

    expect(next).toMatchObject({
      kind: "RECT",
      x: 65,
      y: 50,
      width: 120,
      height: 80,
    })
  })

  it("resizes rectangular annotations from a corner handle", () => {
    const positionData: PositionData = {
      kind: "RECT",
      pageNumber: 1,
      x: 40,
      y: 50,
      width: 120,
      height: 80,
    }

    const next = resizePositionData(
      positionData,
      "se",
      { x: 220, y: 180 },
      1,
      612,
      792
    )

    expect(next).toMatchObject({
      kind: "RECT",
      x: 40,
      y: 50,
      width: 180,
      height: 130,
    })
  })

  it("resizes arrows from the end handle", () => {
    const positionData: PositionData = {
      kind: "ARROW",
      pageNumber: 1,
      from: { x: 50, y: 60 },
      to: { x: 150, y: 160 },
      strokeWidth: 2,
    }

    const next = resizePositionData(
      positionData,
      "end",
      { x: 240, y: 260 },
      1,
      612,
      792
    )

    expect(next).toMatchObject({
      kind: "ARROW",
      from: { x: 50, y: 60 },
      to: { x: 240, y: 260 },
    })
  })
})
