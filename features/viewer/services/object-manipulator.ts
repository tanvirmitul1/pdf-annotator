import { type PdfObject } from "@/lib/pdf/analyzer"

export class ObjectManipulator {
  static async updateText(
    documentId: string,
    obj: PdfObject,
    newText: string
  ): Promise<void> {
    const res = await fetch(`/api/documents/${documentId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        edits: [{
          pageNumber: obj.pageNumber,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          text: newText,
          fontSize: obj.fontSize,
          fontFamily: obj.fontName,
          color: "#000000", // Default to black for now
        }]
      })
    })

    if (!res.ok) {
      throw new Error("Failed to update PDF object")
    }
  }

  static async deleteObject(
    documentId: string,
    obj: PdfObject
  ): Promise<void> {
    // To 'delete' in PDF-lib, we just mask it with white without adding new text
    const res = await fetch(`/api/documents/${documentId}/edit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        edits: [{
          pageNumber: obj.pageNumber,
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
          text: "", // Empty string to hide it
          fontSize: 1,
          fontFamily: "Helvetica",
          color: "#ffffff",
        }]
      })
    })

    if (!res.ok) {
      throw new Error("Failed to delete PDF object")
    }
  }
}
