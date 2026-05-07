export interface PdfObject {
  id: string
  type: "text" | "image"
  pageNumber: number
  x: number
  y: number
  width: number
  height: number
  content?: string
  fontName?: string
  fontSize?: number
}


/**
 * Heuristic to detect if extracted text is likely corrupted (e.g. bad font encoding or broken ligatures).
 * 
 * This is in a separate file from analyzer.ts so it can be safely imported by
 * client components without pulling in pdfjs-dist (which is server-only).
 */
export function isGarbageText(text: string): boolean {
  // Completely empty or whitespace-only pages should use OCR
  if (!text || text.trim().length === 0) return true
  
  const clean = text.trim()
  
  // Very short text (< 10 chars) is likely valid (e.g. page numbers, chapter titles).
  // Only flag it as garbage if it contains obvious corruption markers.
  if (clean.length < 10) {
    const hasReplacement = clean.includes("\uFFFD")
    return hasReplacement
  }
  
  // 1. Detect high ratio of "Replacement Character" (�)
  const replacementChars = (clean.match(/\uFFFD/g) || []).length
  if (replacementChars / clean.length > 0.1) return true
  
  // 2. Detect broken Bangla ligatures (isolated vowel signs/consonants)
  // Bangla Unicode range: 0980–09FF
  const banglaChars = (clean.match(/[\u0980-\u09FF]/g) || []).length
  if (banglaChars > 5) {
    // Check for high frequency of standalone vowel signs (which should be attached to consonants)
    // and isolated consonants separated by spaces.
    const isolatedChars = (clean.match(/[\u0980-\u09FF]\s+[\u0980-\u09FF]/g) || []).length
    if (isolatedChars / banglaChars > 0.2) return true
    
    // Check for many consonants without vowel signs in a row (rare in natural Bangla)
    const longConsonantChain = (clean.match(/[\u0995-\u09B9]{5,}/g) || []).length
    if (longConsonantChain > 2) return true
  }

  // 3. Extremely high space or special char density
  const specialChars = (clean.match(/[^a-zA-Z0-9\s\u0980-\u09FF]/g) || []).length
  if ((specialChars + (clean.match(/\s/g) || []).length) / clean.length > 0.5) return true

  return false
}
