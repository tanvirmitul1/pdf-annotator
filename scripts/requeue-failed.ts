import "dotenv/config"

import { prisma } from "@/lib/db/prisma"
import { mainQueue } from "@/lib/jobs/queue"

async function main() {
  const failedDocs = await prisma.document.findMany({
    where: { status: "FAILED" },
    select: { id: true, name: true },
  })

  if (failedDocs.length === 0) {
    console.log("No failed documents found.")
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${failedDocs.length} failed document(s). Requeueing...`)

  // Reset status to PROCESSING so the handler allows re-processing
  await prisma.document.updateMany({
    where: { id: { in: failedDocs.map((d) => d.id) } },
    data: { status: "PROCESSING" },
  })

  // Enqueue a fresh job for each document.
  // BullMQ jobId is reused so duplicate submissions are safe.
  for (const doc of failedDocs) {
    // Remove any existing failed job with the same jobId before adding
    await mainQueue.remove(doc.id).catch(() => undefined)
    await mainQueue.add("document.postProcess", { documentId: doc.id }, { jobId: doc.id })
    console.log(`  ✓ Queued: ${doc.id} (${doc.name})`)
  }

  console.log("Done. Run `pnpm worker` to process the queue.")
  await prisma.$disconnect()
  process.exit(0)
}

main().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
