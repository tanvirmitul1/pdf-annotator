import "dotenv/config"
import { Worker } from "bullmq"
import { mainQueue } from "./queue"
import { processDocumentPostProcess } from "./handlers/document-post-process"

const worker = new Worker(
  "main",
  async (job) => {
    switch (job.name) {
      case "document.postProcess":
        await processDocumentPostProcess(job.data)
        break
      default:
        throw new Error(`Unknown job type: ${job.name}`)
    }
  },
  {
    connection: mainQueue.opts.connection,
  }
)

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`)
})

worker.on("failed", async (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`)

  // Write FAILED to DB only once all BullMQ retries are exhausted
  const totalAttempts = job?.opts.attempts ?? 1
  const attemptsMade = job?.attemptsMade ?? 0
  if (attemptsMade >= totalAttempts && job?.data?.documentId) {
    const { prisma } = await import("@/lib/db/prisma")
    await prisma.document.updateMany({
      where: { id: job.data.documentId, status: { not: "READY" } },
      data: { status: "FAILED", processingProgress: 0 },
    })
  }
})

console.log("Worker started")
