import type { TextAnchor, TextRect } from "@/features/annotations/types"
import { mergeRects } from "./geometry"

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
  const charOriginalIndices: number[] = []

  segments.forEach((segment, index) => {
    for (let i = 0; i < segment.text.length; i += 1) {
      const char = segment.text[i]
      normalizedChars.push(/\s/.test(char) ? " " : char)
      charSources.push(index)
      charOriginalIndices.push(i)
    }
  })

  const finalChars: string[] = []
  const remappedSources: number[] = []
  const remappedOriginalIndices: number[] = []
  let previousWasSpace = false

  for (let i = 0; i < normalizedChars.length; i += 1) {
    const char = normalizedChars[i]
    const isSpace = char === " "

    if (isSpace && previousWasSpace) {
      continue
    }
    previousWasSpace = isSpace

    finalChars.push(char)
    remappedSources.push(charSources[i])
    remappedOriginalIndices.push(charOriginalIndices[i])
  }

  return {
    normalizedText: finalChars.join(""),
    remappedSources,
    remappedOriginalIndices,
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

  const { normalizedText, remappedSources, remappedOriginalIndices } = buildNormalizedSegments(segments)
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
  const rects: TextRect[] = []

  for (let i = matchStart; i < matchEnd && i < remappedSources.length; i += 1) {
    const segmentIndex = remappedSources[i]
    const segment = segments[segmentIndex]
    if (!segment) continue

    // Find the range within the normalized text that belongs to this segment
    let firstInSegment = -1
    let lastInSegment = -1
    for (let j = matchStart; j < matchEnd; j += 1) {
      if (remappedSources[j] === segmentIndex) {
        if (firstInSegment === -1) firstInSegment = j
        lastInSegment = j
      }
    }

    if (firstInSegment === -1) continue

    // Use precise original indices from the mapping
    const localStart = remappedOriginalIndices[firstInSegment]
    const localEnd = remappedOriginalIndices[lastInSegment] + 1

    const charWidth = segment.rect.width / Math.max(segment.text.length, 1)
    
    rects.push({
      ...segment.rect,
      x: segment.rect.x + localStart * charWidth,
      width: (localEnd - localStart) * charWidth,
    })

    // Skip ahead to the next segment
    i = lastInSegment
  }

  if (rects.length === 0) {
    return { rects: anchor.rects, orphaned: true }
  }

  return {
    rects: mergeRects(rects),
    orphaned: false,
  }
}
