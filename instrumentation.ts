import * as Sentry from "@sentry/nextjs"

import { env } from "@/lib/env"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      tracesSampleRate: 1,
      environment: env.APP_ENV,
    })
  }
}

export const onRequestError = Sentry.captureRequestError
