import { type Document, Prisma } from "@prisma/client"
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
type ProgressFn = (percent: number) => Promise<unknown>

import { createWorker, createScheduler } from "tesseract.js"

/** Process pages in parallel batches to avoid overwhelming memory. */
const PAGE_CONCURRENCY = 8

async function processPdf(document: PdfDocumentRecord, storage: StorageAdapter, setProgress: ProgressFn) {
  const t0 = Date.now()
  const originalStream = await storage.get(document.storageKey)
  const buffer = await streamToBuffer(originalStream)
  console.log(`[${document.id}] Downloaded original in ${Date.now() - t0}ms`)
  await setProgress(10)

  // Load PDF
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
    cMapUrl: _pdfjsRoot + "cmaps/",
    cMapPacked: true,
    wasmUrl: WASM_URL,
    password: "", 
  }).promise.catch(async (err) => {
    if (err.name === "PasswordException") {
      await prisma.document.update({
        where: { id: document.id },
        data: { status: "FAILED", processingProgress: 0 },
      })
      throw new Error("Password-protected PDFs are not supported")
    }
    throw err
  })
  const numPages = pdf.numPages
  console.log(`[${document.id}] Loaded PDF: ${numPages} pages`)
  await setProgress(20)

  // Generate thumbnail from first page at reduced scale for speed
  const tThumb = Date.now()
  const thumbnailKey = await generatePdfThumbnail(pdf, document, storage)
  console.log(`[${document.id}] Thumbnail generated in ${Date.now() - tThumb}ms`)
  await setProgress(35)

  // Extract objects and outline concurrently
  const tExtract = Date.now()
  const [{ textEntries }, outlineEntries] = await Promise.all([
    extractObjectMetadata(pdf, document.id, numPages, (p) => setProgress(35 + (p * 45))),
    pdf.getOutline().then((outline) =>
      outline ? extractOutline(outline as unknown as OutlineItem[]) : []
    ),
  ])
  console.log(`[${document.id}] Objects + outline extracted in ${Date.now() - tExtract}ms`)
  await setProgress(85)

  // Single transaction for all DB writes
  const tDb = Date.now()
  await prisma.$transaction([
    prisma.documentText.deleteMany({ where: { documentId: document.id } }),
    prisma.documentText.createMany({ 
      data: textEntries.map((e) => ({
        documentId: e.documentId,
        pageNumber: e.pageNumber,
        text: e.text,
        objects: e.objects as unknown as Prisma.InputJsonValue,
      })) 
    }),
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
  await setProgress(98)
}

import { PdfAnalyzer, isGarbageText, type PdfObject } from "@/lib/pdf/analyzer"

async function extractObjectMetadata(
  pdf: pdfjs.PDFDocumentProxy,
  documentId: string,
  numPages: number,
  onProgress: (p: number) => void
): Promise<{
  textEntries: Array<{ documentId: string; pageNumber: number; text: string; objects: PdfObject[] }>
}> {
  const textEntries: Array<{ documentId: string; pageNumber: number; text: string; objects: PdfObject[] }> = []
  const pages = Array.from({ length: numPages }, (_, i) => i + 1)
  let completed = 0

  // Lazy OCR scheduler — only initialized when the first garbage page is detected.
  // This avoids ~8-12s of Tesseract worker startup for PDFs with clean text layers.
  const ocrRef: { scheduler: ReturnType<typeof createScheduler> | null } = { scheduler: null }

  async function getOcrScheduler() {
    if (!ocrRef.scheduler) {
      console.log(`[${documentId}] Initializing OCR scheduler (first garbage page detected)...`)
      const t = Date.now()
      ocrRef.scheduler = createScheduler()
      const numWorkers = Math.min(4, PAGE_CONCURRENCY)
      await Promise.all(
        Array.from({ length: numWorkers }).map(async () => {
          const worker = await createWorker(["eng", "ben"])
          ocrRef.scheduler!.addWorker(worker)
        })
      )
      console.log(`[${documentId}] OCR scheduler ready in ${Date.now() - t}ms (${numWorkers} workers)`)
    }
    return ocrRef.scheduler
  }

  const processPage = async (pageNum: number) => {
    const page = await pdf.getPage(pageNum)
    let objects = await PdfAnalyzer.analyzePage(page, pageNum)
    
    // Aggregate full text for search
    let fullText = objects
      .filter(o => o.type === "text")
      .map(o => o.content)
      .join(" ")
      .trim()

    // OCR Fallback if page has no text or text is garbage (e.g., scanned image or bad font encoding)
    if (isGarbageText(fullText)) {
      console.log(`[${documentId}] Page ${pageNum} text layer is missing or corrupted, running OCR...`)
      const ocrScheduler = await getOcrScheduler()
      const ocrResult = await performOcrOnPage(page, pageNum, ocrScheduler)
      if (ocrResult) {
        fullText = ocrResult.text
        objects = ocrResult.objects
      }
    }

    completed++
    onProgress(completed / numPages)
    
    textEntries.push({ 
      documentId, 
      pageNumber: pageNum, 
      text: fullText, 
      objects 
    })
  }

  // Batch for performance
  try {
    for (let i = 0; i < numPages; i += PAGE_CONCURRENCY) {
      const batch = pages.slice(i, i + PAGE_CONCURRENCY)
      await Promise.all(batch.map(processPage))
    }
  } finally {
    // Cleanup workers to release memory (only if they were ever created)
    if (ocrRef.scheduler) {
      await ocrRef.scheduler.terminate()
    }
  }


  return { textEntries }
}


interface OcrWord {
  bbox: { x0: number; y0: number; x1: number; y1: number }
  text: string
}

async function performOcrOnPage(
  page: pdfjs.PDFPageProxy, 
  pageNum: number, 
  scheduler: ReturnType<typeof createScheduler>
): Promise<{ text: string, objects: PdfObject[] } | null> {
  const viewport = page.getViewport({ scale: 2.0 }) // High scale for recognition
  const { createCanvas } = await import("@napi-rs/canvas")
  const canvas = createCanvas(viewport.width, viewport.height)
  const context = canvas.getContext("2d")

  await page.render({ 
    canvas: canvas as unknown as HTMLCanvasElement, 
    canvasContext: context as unknown as CanvasRenderingContext2D, 
    viewport 
  }).promise

  // OPTIMIZATION: Use Sharp to pre-process the image for OCR
  // This drastically improves accuracy for Bangla scripts
  const rawImage = await canvas.encode("png")
  const processedImage = await sharp(rawImage)
    .grayscale() // Remove color noise
    .normalize() // Expand contrast
    .sharpen()   // Make edges clearer
    .toBuffer()

  const result = await scheduler.addJob("recognize", processedImage) as unknown as { data: { text: string; words: OcrWord[] } }
  const { text, words } = result.data

  // Convert Tesseract words into PdfObjects for selection
  const objects: PdfObject[] = words.map((word: OcrWord, idx: number) => ({
    id: `ocr-${pageNum}-${idx}`,
    type: "text" as const,
    pageNumber: pageNum,
    x: word.bbox.x0 / 2.0, 
    y: word.bbox.y0 / 2.0,
    width: (word.bbox.x1 - word.bbox.x0) / 2.0,
    height: (word.bbox.y1 - word.bbox.y0) / 2.0,
    content: word.text,
    fontSize: (word.bbox.y1 - word.bbox.y0) / 2.0 * 0.8,
  }))

  return {
    text: text.replace(/\0/g, ""),
    objects
  }
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
  await page.render({ 
    canvas: canvas as unknown as HTMLCanvasElement, 
    canvasContext: context as unknown as CanvasRenderingContext2D, 
    viewport 
  }).promise

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
  const originalStream = await storage.get(document.storageKey)
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
      title: (item.title ?? "").replace(/\0/g, ""),
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
