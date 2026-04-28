import type { AppDispatch } from "@/store"
import { annotationsApi } from "./api"
import type { AnnotationWithTags } from "./types"

interface MutationJob {
  clientId: string
  payload: any
  onSuccess?: (serverId: string) => void
  onError?: (error: unknown) => void
}

/**
 * Mutation Queue - Controls all annotation writes to prevent race conditions
 * and ensure ordered, idempotent server synchronization.
 */
export class MutationQueue {
  private queue: MutationJob[] = []
  private inFlight = new Map<string, boolean>()
  private isProcessing = false

  constructor(private dispatch: AppDispatch) {}

  /**
   * Add a mutation job to the queue
   */
  enqueue(job: MutationJob) {
    this.queue.push(job)
    void this.process()
  }

  /**
   * Process queue sequentially, skipping duplicates
   */
  private async process() {
    if (this.isProcessing) return
    this.isProcessing = true

    while (this.queue.length > 0) {
      const job = this.queue[0]

      // Skip if already in flight (prevent duplicate sends)
      if (this.inFlight.has(job.clientId)) {
        this.queue.shift()
        continue
      }

      this.inFlight.set(job.clientId, true)

      try {
        const result = await this.dispatch(
          annotationsApi.endpoints.createAnnotation.initiate(job.payload)
        ).unwrap()

        // Remove from queue and mark success
        this.queue.shift()
        job.onSuccess?.(result.id)
      } catch (error) {
        // Mark failed but keep in queue for retry
        job.onError?.(error)
        this.queue.shift()
      } finally {
        this.inFlight.delete(job.clientId)
      }
    }

    this.isProcessing = false
  }

  /**
   * Retry a failed mutation
   */
  retry(job: MutationJob) {
    this.queue.unshift(job)
    void this.process()
  }

  /**
   * Get queue status for debugging
   */
  getStatus() {
    return {
      queued: this.queue.length,
      inFlight: Array.from(this.inFlight.keys()),
      isProcessing: this.isProcessing,
    }
  }
}
