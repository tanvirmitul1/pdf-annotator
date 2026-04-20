import * as Sentry from "@sentry/nextjs"

import { env } from "@/lib/env"

Sentry.init({
  dsn: env.SENTRY_DSN,
  tracesSampleRate: 1,
  environment: env.APP_ENV,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
