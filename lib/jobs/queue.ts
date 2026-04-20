import { Queue, Worker, QueueEvents } from "bullmq"
import { env } from "@/lib/env"

export const mainQueue = new Queue("main", {
  connection: {
    host: env.REDIS_URL ? new URL(env.REDIS_URL).hostname : "localhost",
    port: env.REDIS_URL ? parseInt(new URL(env.REDIS_URL).port) : 6379,
    password: env.REDIS_URL ? new URL(env.REDIS_URL).password : undefined,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  },
})

export const queueEvents = new QueueEvents("main", {
  connection: mainQueue.opts.connection,
})

// Health check function
export async function getQueueHealth() {
  try {
    const waiting = await mainQueue.getWaiting()
    const active = await mainQueue.getActive()
    const completed = await mainQueue.getCompleted()
    const failed = await mainQueue.getFailed()

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
