import type { Document } from "@prisma/client"
import type { StorageAdapter } from "@/lib/storage"
import { prisma } from "@/lib/db/prisma"
import { createStorageAdapter } from "@/lib/storage"
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs"
import sharp from "sharp"
import { Readable } from "stream"

// Configure PDF.js worker for Node.js using local file:// URIs.
// import.meta.resolve() is used instead of createRequire().resolve() because
// the worker is an ESM .mjs package that webpack cannot handle with CJS require.
// This code only runs inside the BullMQ worker process (never bundled by Next.js).
const _workerUrl = import.meta.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs")
pdfjs.GlobalWorkerOptions.workerSrc = _workerUrl

// Resolve local asset base URL so pdf.js can load fonts and WASM without warnings.
const _pdfjsRoot = import.meta.resolve("pdfjs-dist/package.json").replace(/package\.json$/, "")
const STANDARD_FONT_DATA_URL = _pdfjsRoot + "standard_fonts/"
const WASM_URL = _pdfjsRoot + "wasm/"

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
    return // Already processed — idempotent
  }

  if (document.status === "FAILED") {
    // Reset to PROCESSING so this retry attempt can proceed.
    // The worker's `failed` event (not this handler) is responsible
    // for the final FAILED write after all retries are exhausted.
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "PROCESSING" },
    })
  }

  const storage = createStorageAdapter()

  const fileName = document.name.toLowerCase()
  if (fileName.endsWith(".pdf")) {
    await processPdf(document, storage)
  } else if (
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".gif")
  ) {
    await processImage(document, storage)
  } else {
    throw new Error(`Unsupported document type: ${document.name}`)
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "READY" },
  })
}

type PdfDocumentRecord = Pick<Document, "id" | "userId" | "name" | "fileSize" | "storageKey"> 

async function processPdf(document: PdfDocumentRecord, storage: StorageAdapter) {
  const originalStream = await storage.get(`${document.userId}/${document.id}/original`)
  const buffer = await streamToBuffer(originalStream)

  // Load PDF
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    wasmUrl: WASM_URL,
  }).promise
  const numPages = pdf.numPages

  // Generate thumbnail from first page
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1.0 })
  const { createCanvas } = await import("@napi-rs/canvas")
  const canvas = createCanvas(viewport.width, viewport.height)
  const context = canvas.getContext("2d")

  // @napi-rs/canvas is not typed as HTMLCanvasElement but is API-compatible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await page.render({ canvas: canvas as any, canvasContext: context as any, viewport }).promise

  const thumbnailBuffer = await sharp(await canvas.encode("png"))
    .resize(400, 520, { fit: "inside" })
    .webp()
    .toBuffer()

  const { key: thumbnailKey } = await storage.upload(
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
      thumbnailKey,
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

  const { key: thumbnailKey } = await storage.upload(
    document.userId,
    document.id,
    Readable.from(thumbnailBuffer),
    "image/webp",
    "thumb.webp"
  )

  // For images, set pageCount to 1
  await prisma.document.update({
    where: { id: document.id },
    data: { pageCount: 1, thumbnailKey },
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
