import { NextResponse } from "next/server"
import { getQueueHealth } from "@/lib/jobs/queue"

export async function GET() {
  const queueHealth = await getQueueHealth()

  return NextResponse.json({
    status: "ok",
    queue: queueHealth,
  })
}