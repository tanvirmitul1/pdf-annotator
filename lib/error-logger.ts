import { prisma } from "@/lib/db/prisma"
import type { ErrorType } from "@prisma/client"

interface ErrorContext {
  userId?: string
  userEmail?: string
  userName?: string
  url?: string
  method?: string
  statusCode?: number
  userAgent?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
}

interface LogErrorOptions extends ErrorContext {
  error: Error | unknown
  errorType?: ErrorType
  errorCode?: string
}

export async function logError(options: LogErrorOptions): Promise<void> {
  try {
    const {
      error,
      errorType = "UNKNOWN_ERROR",
      errorCode,
      userId,
      userEmail,
      userName,
      url,
      method,
      statusCode,
      userAgent,
      ipAddress = "unknown",
      metadata,
    } = options

    const errorObj = error instanceof Error ? error : new Error(String(error))

    await prisma.errorLog.create({
      data: {
        userId,
        userEmail,
        userName,
        errorType,
        errorCode,
        message: errorObj.message,
        stack: errorObj.stack,
        url,
        method,
        statusCode,
        userAgent,
        ipAddress,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      },
    })
  } catch (logError) {
    // Fail silently to avoid infinite loops
    console.error("Failed to log error:", logError)
  }
}

export async function logApiError(
  error: Error | unknown,
  request: Request,
  userId?: string
): Promise<void> {
  const url = new URL(request.url)
  const errorType = mapErrorToType(error)

  await logError({
    error,
    errorType,
    userId,
    url: url.pathname,
    method: request.method,
    statusCode: getStatusCode(error),
    userAgent: request.headers.get("user-agent") || undefined,
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })
}

export async function logClientError(
  error: Error | unknown,
  context: ErrorContext
): Promise<void> {
  const errorType = mapErrorToType(error)

  await logError({
    error,
    errorType,
    ...context,
  })
}

function mapErrorToType(error: unknown): ErrorType {
  if (!(error instanceof Error)) return "UNKNOWN_ERROR"

  const message = error.message.toLowerCase()
  const name = error.name.toLowerCase()

  if (name.includes("validation") || message.includes("validation")) {
    return "VALIDATION_ERROR"
  }
  if (name.includes("auth") || message.includes("unauthorized") || message.includes("unauthenticated")) {
    return "AUTHENTICATION_ERROR"
  }
  if (message.includes("forbidden") || message.includes("permission")) {
    return "AUTHORIZATION_ERROR"
  }
  if (name.includes("notfound") || message.includes("not found")) {
    return "NOT_FOUND_ERROR"
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "RATE_LIMIT_ERROR"
  }
  if (name.includes("prisma") || message.includes("database")) {
    return "DATABASE_ERROR"
  }
  if (message.includes("upload") || message.includes("file")) {
    return "FILE_UPLOAD_ERROR"
  }
  if (message.includes("processing")) {
    return "PROCESSING_ERROR"
  }

  return "INTERNAL_SERVER_ERROR"
}

function getStatusCode(error: unknown): number | undefined {
  if (error && typeof error === "object" && "statusCode" in error) {
    return error.statusCode as number
  }
  if (error && typeof error === "object" && "status" in error) {
    return error.status as number
  }
  return undefined
}
