import type { PositionData, TextRect } from "./types"

export type ResizeHandle = "nw" | "ne" | "sw" | "se" | "start" | "end" | "rot"

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
  return true
}

export function isResizablePosition(positionData: PositionData) {
  return (
    positionData.kind === "RECT" ||
    positionData.kind === "TEXT_BOX" ||
    positionData.kind === "ARROW" ||
    positionData.kind === "SIGNATURE" ||
    positionData.kind === "IMAGE" ||
    positionData.kind === "CLOUD" ||
    positionData.kind === "TEXT"
  )
}

export function translatePositionData(
  positionData: PositionData,
  delta: { x: number; y: number },
  srcW: number,
  srcH: number
): PositionData {
  switch (positionData.kind) {
    case "TEXT": {
      return {
        ...positionData,
        anchor: {
          ...positionData.anchor,
          rects: positionData.anchor.rects.map(r => ({
            ...r,
            x: clamp(r.x + delta.x, 0, srcW - r.width),
            y: clamp(r.y + delta.y, 0, srcH - r.height),
          }))
        }
      }
    }
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
    case "RECT":
    case "TEXT_BOX": {
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
    case "SIGNATURE":
    case "IMAGE":
    case "CLOUD": {
      const nextX = clamp(
        positionData.x + delta.x,
        0,
        Math.max(0, srcW - positionData.width)
      )
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

  if (
    positionData.kind === "RECT" ||
    positionData.kind === "TEXT_BOX" ||
    positionData.kind === "CLOUD"
  ) {
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

  if (positionData.kind === "SIGNATURE" || positionData.kind === "IMAGE") {
    let left = positionData.x
    let right = positionData.x + positionData.width
    let top = positionData.y
    let bottom = positionData.y + positionData.height

    if (handle === "nw" || handle === "sw") left = clampedPoint.x
    if (handle === "ne" || handle === "se") right = clampedPoint.x
    if (handle === "nw" || handle === "ne") top = clampedPoint.y
    if (handle === "sw" || handle === "se") bottom = clampedPoint.y

    if (Math.abs(right - left) < minSize) {
      if (handle === "nw" || handle === "sw") left = right - minSize
      else right = left + minSize
    }

    if (Math.abs(bottom - top) < minSize) {
      if (handle === "nw" || handle === "ne") top = bottom - minSize
      else bottom = top + minSize
    }

    return {
      ...positionData,
      x: Math.min(left, right),
      y: Math.min(top, bottom),
      width: Math.max(minSize, Math.abs(right - left)),
      height: Math.max(minSize, Math.abs(bottom - top)),
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

  if (positionData.kind === "TEXT") {
    const rects = positionData.anchor.rects
    if (rects.length === 0) return positionData

    // Find overall bounding box
    const minX = Math.min(...rects.map(r => r.x))
    const maxX = Math.max(...rects.map(r => r.x + r.width))
    const minY = Math.min(...rects.map(r => r.y))
    const maxY = Math.max(...rects.map(r => r.y + r.height))
    
    let nextMinX = minX, nextMaxX = maxX, nextMinY = minY, nextMaxY = maxY

    if (handle === "nw" || handle === "sw") nextMinX = clampedPoint.x
    if (handle === "ne" || handle === "se") nextMaxX = clampedPoint.x
    if (handle === "nw" || handle === "ne") nextMinY = clampedPoint.y
    if (handle === "sw" || handle === "se") nextMaxY = clampedPoint.y

    const scaleX = (nextMaxX - nextMinX) / Math.max(maxX - minX, 1)
    const scaleY = (nextMaxY - nextMinY) / Math.max(maxY - minY, 1)

    return {
      ...positionData,
      anchor: {
        ...positionData.anchor,
        rects: rects.map(r => ({
          x: nextMinX + (r.x - minX) * scaleX,
          y: nextMinY + (r.y - minY) * scaleY,
          width: r.width * scaleX,
          height: r.height * scaleY,
        }))
      }
    }
  }

  return positionData
}

export function rotatePositionData(
  positionData: PositionData,
  currentPoint: { x: number; y: number },
  center: { x: number; y: number }
): PositionData {
  if (
    positionData.kind !== "RECT" &&
    positionData.kind !== "TEXT_BOX" &&
    positionData.kind !== "SIGNATURE" &&
    positionData.kind !== "IMAGE" &&
    positionData.kind !== "CLOUD"
  ) {
    return positionData
  }

  // Calculate angle between vertical axis and vector from center to currentPoint
  const dx = currentPoint.x - center.x
  const dy = currentPoint.y - center.y
  
  // Math.atan2 returns angle from positive X axis. 
  // We want angle from positive Y axis (upwards).
  // atan2(y, x) -> atan2(dy, dx)
  // angle in radians
  const radians = Math.atan2(dy, dx)
  const degrees = (radians * 180) / Math.PI + 90 // offset by 90 to make "up" = 0

  return {
    ...positionData,
    rotation: (degrees + 360) % 360,
  }
}

export function positionDataEquals(a: PositionData, b: PositionData) {
  return JSON.stringify(a) === JSON.stringify(b)
}

/**
 * Simplify path points using Ramer-Douglas-Peucker algorithm.
 * Reduces payload size by 50-70% while preserving visual quality.
 * 
 * @param points - Array of path points
 * @param tolerance - Maximum allowed deviation in PDF coords (default: 2)
 * @returns Simplified array of points
 */
export function simplifyPath(
  points: Array<{ x: number; y: number }>,
  tolerance = 2
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points

  const squareDistance = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return dx * dx + dy * dy
  }

  const perpendicularDistance = (
    point: { x: number; y: number },
    lineStart: { x: number; y: number },
    lineEnd: { x: number; y: number }
  ) => {
    const dx = lineEnd.x - lineStart.x
    const dy = lineEnd.y - lineStart.y
    const length = Math.sqrt(dx * dx + dy * dy)

    if (length === 0) return Math.sqrt(squareDistance(point, lineStart))

    return (
      Math.abs(
        dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x
      ) / length
    )
  }

  let maxDistance = 0
  let index = 0

  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1])
    if (distance > maxDistance) {
      maxDistance = distance
      index = i
    }
  }

  if (maxDistance > tolerance) {
    const left = simplifyPath(points.slice(0, index + 1), tolerance)
    const right = simplifyPath(points.slice(index), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [points[0], points[points.length - 1]]
}

/**
 * Merges a list of rectangles into a minimal set of horizontal lines.
 * Useful for cleaning up messy PDF text selections where each character might have its own rect.
 */
export function mergeRects(rects: TextRect[], toleranceY = 2): TextRect[] {
  if (rects.length <= 1) return rects

  // Sort by Y first, then X
  const sorted = [...rects].sort((a, b) => (a.y - b.y) || (a.x - b.x))
  const merged: TextRect[] = []

  let current = sorted[0]

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]

    // Check if on same "line"
    const sameLine = Math.abs(current.y - next.y) < toleranceY && 
                     Math.abs(current.height - next.height) < (current.height * 0.3)

    // Check if overlapping or adjacent on X
    // We allow a small gap (e.g., 20% of height) to merge words into sentences
    const xGap = next.x - (current.x + current.width)
    const adjacent = xGap < (current.height * 0.5)

    if (sameLine && adjacent) {
      // Merge into current
      const newRight = Math.max(current.x + current.width, next.x + next.width)
      current = {
        ...current,
        x: Math.min(current.x, next.x),
        width: newRight - Math.min(current.x, next.x),
        // Average the Y and Height slightly or just keep current
        y: (current.y + next.y) / 2,
        height: (current.height + next.height) / 2,
      }
    } else {
      merged.push(current)
      current = next
    }
  }
  merged.push(current)

  return merged
}
