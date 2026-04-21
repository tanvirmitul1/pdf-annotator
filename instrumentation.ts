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
  // The BullMQ worker is a separate process: run `pnpm worker` in a second terminal.
  // Never import lib/jobs/worker here — it pulls in pdfjs-dist and @napi-rs/canvas
  // which are not webpack-compatible and will crash the Next.js server.
}

export const onRequestError = Sentry.captureRequestError
