import { NextResponse, type NextRequest } from "next/server"
import { ZodError } from "zod"

import { AppError, RateLimitedError } from "@/lib/errors"

export function withErrorHandling<TContext>(
  handler: (req: NextRequest, ctx: TContext) => Promise<Response>
) {
  return async (req: NextRequest, ctx: TContext) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return toErrorResponse(error)
    }
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_FAILED",
          message: "Invalid input",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 }
    )
  }

  if (error instanceof AppError) {
    const headers =
      error instanceof RateLimitedError
        ? { "Retry-After": String(error.details?.retryAfter ?? 60) }
        : undefined

    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status, headers }
    )
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL",
        message: "Something went wrong",
      },
    },
    { status: 500 }
  )
}
