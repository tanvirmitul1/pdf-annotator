import * as pdfjs from "pdfjs-dist"

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

export class PdfAnalyzer {
  static async analyzePage(page: pdfjs.PDFPageProxy, pageNum: number): Promise<PdfObject[]> {
    const viewport = page.getViewport({ scale: 1.0 })
    const objects: PdfObject[] = []

    // 1. Extract Text Objects
    const textContent = await page.getTextContent()
    textContent.items.forEach((item, idx) => {
      const textItem = item as { str: string; transform: number[]; width: number; fontName: string }
      const tx = textItem.transform
      objects.push({
        id: `t-${pageNum}-${idx}`,
        type: "text",
        pageNumber: pageNum,
        x: tx[4],
        y: viewport.height - tx[5] - (tx[3] || 12),
        width: textItem.width,
        height: tx[3] || 12,
        content: textItem.str,
        fontName: textItem.fontName,
        fontSize: tx[3] || 12,
      })
    })

    // 2. Extract Image Objects
    try {
      const opList = await page.getOperatorList()
      const OPS = (pdfjs as unknown as { OPS: Record<string, number> }).OPS
      
      for (let i = 0; i < opList.fnArray.length; i++) {
        const fn = opList.fnArray[i]
        if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject) {
          let transform = [1, 0, 0, 1, 0, 0]
          try {
            if (i > 0 && opList.fnArray[i-1] === OPS.transform) {
              transform = opList.argsArray[i-1] as number[]
            }
            
            // Validate transform before pushing
            if (Array.isArray(transform) && transform.length >= 6) {
              objects.push({
                id: `img-${pageNum}-${i}`,
                type: "image",
                pageNumber: pageNum,
                x: transform[4],
                y: viewport.height - transform[5] - transform[3],
                width: transform[0],
                height: transform[3],
              })
            }
          } catch (imgErr) {
            console.warn(`[PdfAnalyzer] Failed to extract image at op ${i} on page ${pageNum}:`, imgErr)
          }
        }
      }
    } catch (opErr) {
      console.error(`[PdfAnalyzer] Failed to get operator list for page ${pageNum}:`, opErr)
    }

    console.log(`[PdfAnalyzer] Extracted ${objects.length} objects from page ${pageNum}`)
    return objects
  }
}
