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

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`)
})

console.log("Worker started")