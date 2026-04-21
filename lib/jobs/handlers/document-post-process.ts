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

  const setProgress = (progress: number) =>
    prisma.document.update({
      where: { id: documentId },
      data: { processingProgress: progress },
    })

  const fileName = document.name.toLowerCase()
  if (fileName.endsWith(".pdf")) {
    await processPdf(document, storage, setProgress)
  } else if (
    fileName.endsWith(".png") ||
    fileName.endsWith(".jpg") ||
    fileName.endsWith(".jpeg") ||
    fileName.endsWith(".webp") ||
    fileName.endsWith(".gif")
  ) {
    await processImage(document, storage, setProgress)
  } else {
    throw new Error(`Unsupported document type: ${document.name}`)
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "READY", processingProgress: 100 },
  })
}

type PdfDocumentRecord = Pick<Document, "id" | "userId" | "name" | "fileSize" | "storageKey">

/** Process pages in parallel batches to avoid overwhelming memory. */
const PAGE_CONCURRENCY = 5

type ProgressFn = (progress: number) => Promise<unknown>

async function processPdf(document: PdfDocumentRecord, storage: StorageAdapter, setProgress: ProgressFn) {
  const t0 = Date.now()
  const originalStream = await storage.get(`${document.userId}/${document.id}/original`)
  const buffer = await streamToBuffer(originalStream)
  console.log(`[${document.id}] Downloaded original in ${Date.now() - t0}ms`)
  await setProgress(10)

  // Load PDF
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    wasmUrl: WASM_URL,
  }).promise
  const numPages = pdf.numPages
  console.log(`[${document.id}] Loaded PDF: ${numPages} pages`)
  await setProgress(20)

  // Generate thumbnail from first page at reduced scale for speed
  const tThumb = Date.now()
  const thumbnailKey = await generatePdfThumbnail(pdf, document, storage)
  console.log(`[${document.id}] Thumbnail generated in ${Date.now() - tThumb}ms`)
  await setProgress(35)

  // Extract text (batched) and outline concurrently
  const tExtract = Date.now()
  const [textEntries, outlineEntries] = await Promise.all([
    extractTextBatched(pdf, document.id, numPages),
    pdf.getOutline().then((outline) =>
      outline ? extractOutline(outline as unknown as OutlineItem[]) : []
    ),
  ])
  console.log(`[${document.id}] Text + outline extracted in ${Date.now() - tExtract}ms`)
  await setProgress(80)

  // Single transaction for all DB writes
  const tDb = Date.now()
  await prisma.$transaction([
    prisma.documentText.createMany({ data: textEntries, skipDuplicates: true }),
    prisma.documentOutline.upsert({
      where: { documentId: document.id },
      update: { entries: outlineEntries },
      create: { documentId: document.id, entries: outlineEntries },
    }),
    prisma.document.update({
      where: { id: document.id },
      data: { pageCount: numPages, thumbnailKey },
    }),
  ])
  console.log(`[${document.id}] DB writes in ${Date.now() - tDb}ms (total: ${Date.now() - t0}ms)`)
  await setProgress(95)
}

async function extractTextBatched(
  pdf: pdfjs.PDFDocumentProxy,
  documentId: string,
  numPages: number,
): Promise<Array<{ documentId: string; pageNumber: number; text: string }>> {
  const results: Array<{ documentId: string; pageNumber: number; text: string }> = []

  for (let start = 1; start <= numPages; start += PAGE_CONCURRENCY) {
    const end = Math.min(start + PAGE_CONCURRENCY - 1, numPages)
    const batch = Array.from({ length: end - start + 1 }, (_, i) => start + i)

    const batchResults = await Promise.all(
      batch.map(async (pageNum) => {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const text = textContent.items
          .map((item) => ((item as { str?: string }).str ?? ""))
          .join(" ")
        return { documentId, pageNumber: pageNum, text }
      }),
    )
    results.push(...batchResults)
  }

  return results
}

async function generatePdfThumbnail(
  pdf: pdfjs.PDFDocumentProxy,
  document: PdfDocumentRecord,
  storage: StorageAdapter,
): Promise<string> {
  const page = await pdf.getPage(1)
  // Render at reduced scale — thumbnail only needs 400px wide
  const desiredWidth = 400
  const naturalViewport = page.getViewport({ scale: 1.0 })
  const thumbScale = Math.min(desiredWidth / naturalViewport.width, 1.0)
  const viewport = page.getViewport({ scale: thumbScale })

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

  const { key } = await storage.upload(
    document.userId,
    document.id,
    Readable.from(thumbnailBuffer),
    "image/webp",
    "thumb.webp",
  )
  return key
}

async function processImage(document: PdfDocumentRecord, storage: StorageAdapter, setProgress: ProgressFn) {
  const originalStream = await storage.get(`${document.userId}/${document.id}/original`)
  const buffer = await streamToBuffer(originalStream)
  await setProgress(20)

  // Generate thumbnail
  const thumbnailBuffer = await sharp(buffer)
    .resize(400, null, { withoutEnlargement: true })
    .webp()
    .toBuffer()
  await setProgress(60)

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
  await setProgress(95)
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
