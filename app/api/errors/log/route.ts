import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { withErrorHandling } from "@/lib/api/handler"
import { logClientError } from "@/lib/error-logger"
import { auth } from "@/auth"

const LogErrorSchema = z.object({
  message: z.string(),
  stack: z.string().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
  metadata: z.any().optional(),
})

async function handler(request: NextRequest) {
  const session = await auth()
  const body = await request.json()
  const data = LogErrorSchema.parse(body)

  const error = new Error(data.message)
  if (data.stack) {
    error.stack = data.stack
  }

  await logClientError(error, {
    userId: session?.user?.id,
    userEmail: session?.user?.email || undefined,
    userName: session?.user?.name || undefined,
    url: data.url,
    userAgent: data.userAgent || request.headers.get("user-agent") || undefined,
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
    metadata: data.metadata,
  })

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(handler)
