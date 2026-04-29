import { NextRequest, NextResponse } from "next/server"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logError } from "@/lib/error-logger"

async function handler(request: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "validation"

  // Generate sample errors for testing
  const sampleErrors = [
    {
      type: "validation",
      error: new Error("Invalid email format provided"),
      errorType: "VALIDATION_ERROR" as const,
    },
    {
      type: "auth",
      error: new Error("Unauthorized access attempt"),
      errorType: "AUTHENTICATION_ERROR" as const,
    },
    {
      type: "notfound",
      error: new Error("Document not found"),
      errorType: "NOT_FOUND_ERROR" as const,
    },
    {
      type: "database",
      error: new Error("Database connection failed"),
      errorType: "DATABASE_ERROR" as const,
    },
    {
      type: "internal",
      error: new Error("Internal server error occurred"),
      errorType: "INTERNAL_SERVER_ERROR" as const,
    },
  ]

  const selectedError = sampleErrors.find((e) => e.type === type) || sampleErrors[0]

  await logError({
    error: selectedError.error,
    errorType: selectedError.errorType,
    url: request.url,
    method: request.method,
    statusCode: 500,
    ipAddress: request.headers.get("x-forwarded-for") || "127.0.0.1",
    metadata: {
      test: true,
      generatedAt: new Date().toISOString(),
    },
  })

  return NextResponse.json({
    success: true,
    message: `Generated ${type} error for testing`,
  })
}

export const GET = withErrorHandling(handler)
