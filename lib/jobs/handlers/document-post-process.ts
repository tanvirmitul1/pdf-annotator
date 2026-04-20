import type { Document } from "@prisma/client"
import type { StorageAdapter } from "@/lib/storage"
import { prisma } from "@/lib/db/prisma"
import { createStorageAdapter } from "@/lib/storage"
import * as pdfjs from "pdfjs-dist"
import sharp from "sharp"
import { Readable } from "stream"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface DocumentPostProcessPayload {
  documentId: string
}

export async function processDocumentPostProcess({ documentId }: DocumentPostProcessPayload) {
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  })

  if (!document) {
    throw new Error(`Document ${documentId} not found`)
  }

  if (document.status === "READY") {
    // Already processed
    return
  }

  if (document.status !== "PROCESSING") {
    throw new Error(`Document ${documentId} is not in PROCESSING status`)
  }

  const storage = createStorageAdapter()

  try {
    const fileName = document.name.toLowerCase()
    if (fileName.endsWith(".pdf")) {
      await processPdf(document, storage)
    } else if (fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg") || fileName.endsWith(".webp") || fileName.endsWith(".gif")) {
      await processImage(document, storage)
    } else {
      throw new Error(`Unsupported document type: ${document.name}`)
    }

    await prisma.document.update({
      where: { id: documentId },
      data: { status: "READY" },
    })
  } catch (error) {
    console.error(`Failed to process document ${documentId}:`, error)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "FAILED" },
    })
    throw error
  }
}

type PdfDocumentRecord = Pick<Document, "id" | "userId" | "name" | "fileSize" | "storageKey"> 

async function processPdf(document: PdfDocumentRecord, storage: StorageAdapter) {
  const originalStream = await storage.get(`${document.userId}/${document.id}/original`)
  const buffer = await streamToBuffer(originalStream)

  // Load PDF
  const pdf = await pdfjs.getDocument({ data: buffer }).promise
  const numPages = pdf.numPages

  // Generate thumbnail from first page
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1.0 })
  const canvasModule = await import("canvas")
  const canvas = new canvasModule.Canvas(viewport.width, viewport.height)
  const context = canvas.getContext("2d") as unknown

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.render({ canvas: canvas as any, canvasContext: context as any, viewport }).promise

  const thumbnailBuffer = await sharp(canvas.toBuffer("image/png"))
    .resize(400, 520, { fit: "inside" })
    .webp()
    .toBuffer()

  await storage.upload(
    document.userId,
    document.id,
    Readable.from(thumbnailBuffer),
    "image/webp",
    "thumb.webp"
  )

  // Extract text per page
  const textEntries: Array<{ documentId: string; pageNumber: number; text: string }> = []
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()
    const text = textContent.items
      .map((item) => ((item as { str?: string }).str ?? ""))
      .join(" ")

    textEntries.push({
      documentId: document.id,
      pageNumber: pageNum,
      text,
    })
  }

  await prisma.documentText.createMany({
    data: textEntries,
    skipDuplicates: true,
  })

  // Extract outline
  const outline = await pdf.getOutline()
  const outlineEntries = outline ? extractOutline(outline as unknown as OutlineItem[]) : []

  await prisma.documentOutline.upsert({
    where: { documentId: document.id },
    update: { entries: outlineEntries },
    create: {
      documentId: document.id,
      entries: outlineEntries,
    },
  })

  // Update document metadata
  await prisma.document.update({
    where: { id: document.id },
    data: {
      pageCount: numPages,
    },
  })
}

async function processImage(document: PdfDocumentRecord, storage: StorageAdapter) {
  const originalStream = await storage.get(`${document.userId}/${document.id}/original`)
  const buffer = await streamToBuffer(originalStream)

  // Generate thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(400, null, { withoutEnlargement: true })
    .webp()
    .toBuffer()

  await storage.upload(
    document.userId,
    document.id,
    Readable.from(thumbnailBuffer),
    "image/webp",
    "thumb.webp"
  )

  // For images, set pageCount to 1
  await prisma.document.update({
    where: { id: document.id },
    data: { pageCount: 1 },
  })
}

interface OutlineItem {
  title: string
  dest?: Array<{ num?: number }>
  items?: OutlineItem[]
}

function extractOutline(outline: OutlineItem[]): Array<{ title: string; pageNumber: number; level: number }> {
  const entries: Array<{ title: string; pageNumber: number; level: number }> = []

  function processItem(item: OutlineItem, level = 0) {
    entries.push({
      title: item.title,
      pageNumber: item.dest?.[0]?.num || 1,
      level,
    })

    item.items?.forEach((child) => processItem(child, level + 1))
  }

  outline.forEach((item) => processItem(item))
  return entries
}

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}