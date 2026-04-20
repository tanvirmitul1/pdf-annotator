export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "QUOTA_EXCEEDED"
  | "FEATURE_GATED"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "INTERNAL"

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "AppError"
  }
}

export class UnauthenticatedError extends AppError {
  constructor() {
    super("UNAUTHENTICATED", 401, "Not signed in")
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", 403, message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", 404, `${resource} not found`)
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>) {
    super("VALIDATION_FAILED", 400, "Invalid input", details)
  }
}

export class QuotaExceededError extends AppError {
  constructor(metric: string, limit: number, current: number) {
    super("QUOTA_EXCEEDED", 402, `${metric} quota exceeded`, {
      metric,
      limit,
      current,
      upgradeUrl: "/app/settings/upgrade",
    })
  }
}

export class FeatureGatedError extends AppError {
  constructor(feature: string) {
    super("FEATURE_GATED", 402, `${feature} is not available on your plan`, {
      feature,
      upgradeUrl: "/app/settings/upgrade",
    })
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfter: number) {
    super("RATE_LIMITED", 429, "Too many requests", { retryAfter })
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", 409, message)
  }
}
