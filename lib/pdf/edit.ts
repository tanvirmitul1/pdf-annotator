import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"

interface TextEdit {
  pageNumber: number
  x: number // src coordinates
  y: number
  width: number
  height: number
  text: number | string
  fontSize: number
  fontFamily: string
  color: string
}

export async function applyTextEditsToPdf(
  pdfBuffer: Buffer,
  edits: TextEdit[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  pdfDoc.registerFontkit(fontkit)

  const pages = pdfDoc.getPages()

  for (const edit of edits) {
    const pageIndex = edit.pageNumber - 1
    if (pageIndex < 0 || pageIndex >= pages.length) continue

    const page = pages[pageIndex]
    const { height: pageHeight } = page.getSize()

    // Convert coordinates: pdf-lib (0,0) is bottom-left
    // Input (x,y) is top-left in src units
    const pdfX = edit.x
    const pdfY = pageHeight - edit.y - edit.height

    // 1. Draw a "mask" to cover original text
    // Heuristic: use white for now, or we could sample the background
    page.drawRectangle({
      x: pdfX,
      y: pdfY,
      width: edit.width,
      height: edit.height,
      color: rgb(1, 1, 1),
    })

    // 2. Draw new text
    // Handle colors
    const hex = edit.color.replace("#", "")
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255

    // For now use StandardFonts, ideally we'd embed custom fonts
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    page.drawText(String(edit.text), {
      x: pdfX,
      y: pdfY + (edit.height * 0.2), // Vertical alignment tweak
      size: edit.fontSize,
      font,
      color: rgb(r, g, b),
    })
  }

  const result = await pdfDoc.save()
  return Buffer.from(result)
}
