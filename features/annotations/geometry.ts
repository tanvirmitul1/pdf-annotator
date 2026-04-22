import type { PositionData } from "./types"

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end"

const MIN_SCREEN_SIZE_PX = 18

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function clampPoint(
  point: { x: number; y: number },
  srcW: number,
  srcH: number
) {
  return {
    x: clamp(point.x, 0, srcW),
    y: clamp(point.y, 0, srcH),
  }
}

export function isMovablePosition(positionData: PositionData) {
  return positionData.kind !== "TEXT"
}

export function isResizablePosition(positionData: PositionData) {
  return positionData.kind === "RECT" || positionData.kind === "ARROW"
}

export function translatePositionData(
  positionData: PositionData,
  delta: { x: number; y: number },
  srcW: number,
  srcH: number
): PositionData {
  switch (positionData.kind) {
    case "TEXT":
      return positionData
    case "POINT": {
      const point = clampPoint(
        {
          x: positionData.x + delta.x,
          y: positionData.y + delta.y,
        },
        srcW,
        srcH
      )
      return {
        ...positionData,
        x: point.x,
        y: point.y,
      }
    }
    case "RECT": {
      const nextX = clamp(positionData.x + delta.x, 0, Math.max(0, srcW - positionData.width))
      const nextY = clamp(
        positionData.y + delta.y,
        0,
        Math.max(0, srcH - positionData.height)
      )
      return {
        ...positionData,
        x: nextX,
        y: nextY,
      }
    }
    case "PATH": {
      const minX = Math.min(...positionData.points.map((point) => point.x))
      const maxX = Math.max(...positionData.points.map((point) => point.x))
      const minY = Math.min(...positionData.points.map((point) => point.y))
      const maxY = Math.max(...positionData.points.map((point) => point.y))
      const allowedDx = clamp(delta.x, -minX, srcW - maxX)
      const allowedDy = clamp(delta.y, -minY, srcH - maxY)

      return {
        ...positionData,
        points: positionData.points.map((point) => ({
          ...point,
          x: point.x + allowedDx,
          y: point.y + allowedDy,
        })),
      }
    }
    case "ARROW": {
      const from = clampPoint(
        {
          x: positionData.from.x + delta.x,
          y: positionData.from.y + delta.y,
        },
        srcW,
        srcH
      )
      const to = clampPoint(
        {
          x: positionData.to.x + delta.x,
          y: positionData.to.y + delta.y,
        },
        srcW,
        srcH
      )
      return {
        ...positionData,
        from,
        to,
      }
    }
  }
}

export function resizePositionData(
  positionData: PositionData,
  handle: ResizeHandle,
  nextPoint: { x: number; y: number },
  zoom: number,
  srcW: number,
  srcH: number
): PositionData {
  const clampedPoint = clampPoint(nextPoint, srcW, srcH)
  const minSize = MIN_SCREEN_SIZE_PX / zoom

  if (positionData.kind === "RECT") {
    let left = positionData.x
    let right = positionData.x + positionData.width
    let top = positionData.y
    let bottom = positionData.y + positionData.height

    if (handle === "nw" || handle === "sw") {
      left = clampedPoint.x
    }
    if (handle === "ne" || handle === "se") {
      right = clampedPoint.x
    }
    if (handle === "nw" || handle === "ne") {
      top = clampedPoint.y
    }
    if (handle === "sw" || handle === "se") {
      bottom = clampedPoint.y
    }

    if (Math.abs(right - left) < minSize) {
      if (handle === "nw" || handle === "sw") {
        left = right - minSize
      } else {
        right = left + minSize
      }
    }

    if (Math.abs(bottom - top) < minSize) {
      if (handle === "nw" || handle === "ne") {
        top = bottom - minSize
      } else {
        bottom = top + minSize
      }
    }

    const nextLeft = clamp(Math.min(left, right), 0, srcW)
    const nextRight = clamp(Math.max(left, right), 0, srcW)
    const nextTop = clamp(Math.min(top, bottom), 0, srcH)
    const nextBottom = clamp(Math.max(top, bottom), 0, srcH)

    return {
      ...positionData,
      x: nextLeft,
      y: nextTop,
      width: Math.max(minSize, nextRight - nextLeft),
      height: Math.max(minSize, nextBottom - nextTop),
    }
  }

  if (positionData.kind === "ARROW") {
    if (handle === "start") {
      return {
        ...positionData,
        from: clampedPoint,
      }
    }

    if (handle === "end") {
      return {
        ...positionData,
        to: clampedPoint,
      }
    }
  }

  return positionData
}

export function positionDataEquals(a: PositionData, b: PositionData) {
  return JSON.stringify(a) === JSON.stringify(b)
}
