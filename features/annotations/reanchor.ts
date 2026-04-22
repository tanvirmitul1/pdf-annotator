import type { TextAnchor, TextRect } from "@/features/annotations/types"

export interface ReanchorSegment {
  text: string
  rect: TextRect
}

export interface ReanchorResult {
  rects: TextRect[]
  orphaned: boolean
}

function buildNormalizedSegments(segments: ReanchorSegment[]) {
  const normalizedChars: string[] = []
  const charSources: number[] = []

  segments.forEach((segment, index) => {
    for (const char of segment.text) {
      normalizedChars.push(/\s/.test(char) ? " " : char)
      charSources.push(index)
    }
  })

  const normalizedText = normalizedChars.join("").replace(/\s+/g, " ")
  const remappedSources: number[] = []
  let previousWasSpace = false

  for (let i = 0; i < normalizedChars.length; i += 1) {
    const char = normalizedChars[i]
    const isSpace = char === " "

    if (isSpace) {
      if (previousWasSpace) {
        continue
      }
      previousWasSpace = true
    } else {
      previousWasSpace = false
    }

    remappedSources.push(charSources[i])
  }

  return {
    normalizedText,
    remappedSources,
  }
}

function normalizeForMatch(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function resolveTextAnchor(
  segments: ReanchorSegment[],
  anchor: TextAnchor
): ReanchorResult {
  if (segments.length === 0) {
    return { rects: anchor.rects, orphaned: true }
  }

  const { normalizedText, remappedSources } = buildNormalizedSegments(segments)
  const quotedText = normalizeForMatch(anchor.quotedText)
  if (!quotedText) {
    return { rects: anchor.rects, orphaned: true }
  }

  const prefix = normalizeForMatch(anchor.prefix)
  const suffix = normalizeForMatch(anchor.suffix)

  const candidates = [
    prefix && suffix ? `${prefix} ${quotedText} ${suffix}` : "",
    prefix ? `${prefix} ${quotedText}` : "",
    suffix ? `${quotedText} ${suffix}` : "",
    quotedText,
  ].filter(Boolean)

  let matchStart = -1
  let matchText = quotedText

  for (const candidate of candidates) {
    const foundAt = normalizedText.indexOf(candidate)
    if (foundAt >= 0) {
      matchStart = foundAt + candidate.indexOf(quotedText)
      matchText = quotedText
      break
    }
  }

  if (matchStart < 0) {
    return { rects: anchor.rects, orphaned: true }
  }

  const matchEnd = matchStart + matchText.length
  const segmentIndexes = new Set<number>()

  for (let i = matchStart; i < matchEnd && i < remappedSources.length; i += 1) {
    segmentIndexes.add(remappedSources[i])
  }

  if (segmentIndexes.size === 0) {
    return { rects: anchor.rects, orphaned: true }
  }

  const rects = Array.from(segmentIndexes)
    .sort((left, right) => left - right)
    .map((index) => segments[index]?.rect)
    .filter((rect): rect is TextRect => Boolean(rect))

  if (rects.length === 0) {
    return { rects: anchor.rects, orphaned: true }
  }

  return {
    rects,
    orphaned: false,
  }
}
