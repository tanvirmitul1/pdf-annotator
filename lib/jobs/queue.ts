type JobHandler<TPayload> = (payload: TPayload) => Promise<void>

interface QueueJob<TPayload> {
  key: string
  payload: TPayload
  retries: number
  handler: JobHandler<TPayload>
}

const queuedJobs: Promise<void>[] = []

export async function enqueueInProcessJob<TPayload>(
  key: string,
  payload: TPayload,
  handler: JobHandler<TPayload>,
  retries = 3
) {
  const job: QueueJob<TPayload> = { key, payload, retries, handler }

  const promise = executeJob(job)
  queuedJobs.push(promise)

  promise.finally(() => {
    const index = queuedJobs.indexOf(promise)
    if (index >= 0) {
      queuedJobs.splice(index, 1)
    }
  })

  return promise
}

async function executeJob<TPayload>(job: QueueJob<TPayload>, attempt = 1): Promise<void> {
  try {
    await job.handler(job.payload)
  } catch (error) {
    if (attempt >= job.retries) {
      throw error
    }

    await new Promise((resolve) => setTimeout(resolve, attempt * 25))
    await executeJob(job, attempt + 1)
  }
}

export async function flushInProcessJobs() {
  await Promise.allSettled([...queuedJobs])
}
