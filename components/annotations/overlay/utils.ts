import { srcToScreen } from "@/features/annotations/types"
import type { PositionData } from "@/features/annotations/types"

export function getScreenBounds(
  positionData: PositionData,
  srcW: number,
  srcH: number,
  zoom: number,
  rotation: 0 | 90 | 180 | 270
) {
  if (positionData.kind === "TEXT") {
    const points = positionData.anchor.rects.flatMap((rect) => {
      const topLeft = srcToScreen(rect.x, rect.y, srcW, srcH, zoom, rotation)
      const bottomRight = srcToScreen(
        rect.x + rect.width,
        rect.y + rect.height,
        srcW,
        srcH,
        zoom,
        rotation
      )

      return [topLeft, bottomRight]
    })

    if (points.length === 0) {
      return null
    }

    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }

  if (positionData.kind === "POINT") {
    const point = srcToScreen(
      positionData.x,
      positionData.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    return {
      x: point.x - 12,
      y: point.y - 12,
      width: 24,
      height: 24,
    }
  }

  if (
    positionData.kind === "RECT" || 
    positionData.kind === "TEXT_BOX" ||
    positionData.kind === "SIGNATURE" ||
    positionData.kind === "IMAGE" ||
    positionData.kind === "CLOUD"
  ) {
    const topLeft = srcToScreen(
      positionData.x,
      positionData.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const bottomRight = srcToScreen(
      positionData.x + (positionData as any).width,
      positionData.y + (positionData as any).height,
      srcW,
      srcH,
      zoom,
      rotation
    )

    return {
      x: Math.min(topLeft.x, bottomRight.x),
      y: Math.min(topLeft.y, bottomRight.y),
      width: Math.abs(bottomRight.x - topLeft.x),
      height: Math.abs(bottomRight.y - topLeft.y),
    }
  }

  if (positionData.kind === "PATH") {
    const screenPoints = positionData.points.map((point) =>
      srcToScreen(point.x, point.y, srcW, srcH, zoom, rotation)
    )
    const xs = screenPoints.map((point) => point.x)
    const ys = screenPoints.map((point) => point.y)
    const padding = Math.max(8, positionData.strokeWidth * zoom)

    return {
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2,
    }
  }

  if (positionData.kind === "ARROW") {
    const from = srcToScreen(
      positionData.from.x,
      positionData.from.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const to = srcToScreen(
      positionData.to.x,
      positionData.to.y,
      srcW,
      srcH,
      zoom,
      rotation
    )
    const padding = Math.max(10, positionData.strokeWidth * zoom * 1.5)

    return {
      x: Math.min(from.x, to.x) - padding,
      y: Math.min(from.y, to.y) - padding,
      width: Math.abs(to.x - from.x) + padding * 2,
      height: Math.abs(to.y - from.y) + padding * 2,
    }
  }

  return { x: 0, y: 0, width: 0, height: 0 }
}

export function segmentTouchesBounds(
  from: { x: number; y: number },
  to: { x: number; y: number },
  bounds: { x: number; y: number; width: number; height: number },
  padding: number
) {
  const expanded = {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  }

  const length = Math.hypot(to.x - from.x, to.y - from.y)
  const samples = Math.max(1, Math.ceil(length / Math.max(padding / 2, 4)))

  for (let index = 0; index <= samples; index += 1) {
    const ratio = index / samples
    const x = from.x + (to.x - from.x) * ratio
    const y = from.y + (to.y - from.y) * ratio

    if (
      x >= expanded.x &&
      x <= expanded.x + expanded.width &&
      y >= expanded.y &&
      y <= expanded.y + expanded.height
    ) {
      return true
    }
  }

  return false
}

export function generateCloudPath(x: number, y: number, width: number, height: number, arcSize: number) {
  const stepsX = Math.ceil(width / arcSize)
  const stepW = width / stepsX
  const stepsY = Math.ceil(height / arcSize)
  const stepH = height / stepsY

  let d = `M ${x} ${y}`

  // Top
  for (let i = 0; i < stepsX; i++) {
    const x1 = x + i * stepW + stepW / 2
    const y1 = y - arcSize / 3
    const x2 = x + (i + 1) * stepW
    const y2 = y
    d += ` Q ${x1} ${y1}, ${x2} ${y2}`
  }
  // Right
  for (let i = 0; i < stepsY; i++) {
    const x1 = x + width + arcSize / 3
    const y1 = y + i * stepH + stepH / 2
    const x2 = x + width
    const y2 = y + (i + 1) * stepH
    d += ` Q ${x1} ${y1}, ${x2} ${y2}`
  }
  // Bottom
  for (let i = stepsX; i > 0; i--) {
    const x1 = x + i * stepW - stepW / 2
    const y1 = y + height + arcSize / 3
    const x2 = x + (i - 1) * stepW
    const y2 = y + height
    d += ` Q ${x1} ${y1}, ${x2} ${y2}`
  }
  // Left
  for (let i = stepsY; i > 0; i--) {
    const x1 = x - arcSize / 3
    const y1 = y + i * stepH - stepH / 2
    const x2 = x
    const y2 = y + (i - 1) * stepH
    d += ` Q ${x1} ${y1}, ${x2} ${y2}`
  }
  return d + " Z"
}

export function simplifyPath(points: { x: number; y: number }[], tolerance: number = 1) {
  if (points.length < 3) return points

  const result = [points[0]]
  let lastPoint = points[0]

  for (let i = 1; i < points.length - 1; i++) {
    const point = points[i]
    const dist = Math.hypot(point.x - lastPoint.x, point.y - lastPoint.y)
    if (dist > tolerance) {
      result.push(point)
      lastPoint = point
    }
  }

  result.push(points[points.length - 1])
  return result
}
