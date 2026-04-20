import { z } from "zod"

const EnvSchema = z.object({
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_URL: z.string().url().default("http://localhost:3000"),
  NEXTAUTH_SECRET: z.string().min(32).default("development-secret-key-should-be-over-32"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("PDF Annotator <no-reply@example.com>"),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().default("https://app.posthog.com"),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
})

export const env = EnvSchema.parse({
  APP_ENV: process.env.APP_ENV,
  APP_URL: process.env.APP_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL,
})
