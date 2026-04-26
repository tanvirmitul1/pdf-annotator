import { z } from "zod"

const optionalNonEmpty = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}, z.string().min(1).optional())

const optionalUrl = z.preprocess((value) => {
  if (typeof value === "string" && value.trim() === "") {
    return undefined
  }

  return value
}, z.string().url().optional())

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  REDIS_URL: optionalNonEmpty,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalNonEmpty,
  STORAGE_DRIVER: z.enum(["local", "s3", "r2", "cloudinary"]).default("local"),
  STORAGE_LOCAL_PATH: optionalNonEmpty,
  S3_BUCKET: optionalNonEmpty,
  S3_REGION: optionalNonEmpty,
  S3_ACCESS_KEY_ID: optionalNonEmpty,
  S3_SECRET_ACCESS_KEY: optionalNonEmpty,
  S3_ENDPOINT: optionalUrl,
  CLOUDINARY_CLOUD_NAME: optionalNonEmpty,
  CLOUDINARY_API_KEY: optionalNonEmpty,
  CLOUDINARY_API_SECRET: optionalNonEmpty,
  RESEND_API_KEY: optionalNonEmpty,
  EMAIL_FROM: z.string().min(1),
  SENTRY_DSN: optionalUrl,
  SENTRY_AUTH_TOKEN: optionalNonEmpty,
  POSTHOG_KEY: optionalNonEmpty,
  POSTHOG_HOST: optionalUrl,
  APP_ENV: z.enum(["development", "staging", "production"]),
  APP_URL: z.string().url(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  CRON_SECRET: optionalNonEmpty,
  ADMIN_EMAILS: optionalNonEmpty,
})

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  STORAGE_LOCAL_PATH: process.env.STORAGE_LOCAL_PATH,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  S3_ENDPOINT: process.env.S3_ENDPOINT,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  POSTHOG_KEY: process.env.POSTHOG_KEY,
  POSTHOG_HOST: process.env.POSTHOG_HOST,
  APP_ENV: process.env.APP_ENV,
  APP_URL: process.env.APP_URL,
  LOG_LEVEL: process.env.LOG_LEVEL,
  CRON_SECRET: process.env.CRON_SECRET,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS,
})
