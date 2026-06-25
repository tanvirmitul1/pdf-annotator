# ENV.md

Every environment variable, documented. Validated by `/lib/env.ts` with Zod at boot — app refuses to start if invalid.

## Required in all environments

### Database

- `DATABASE_URL` — Postgres connection string
- `DIRECT_URL` — Direct (non-pooled) URL for migrations

### Auth

- `NEXTAUTH_URL` — Public URL of app (`http://localhost:3000` in dev)
- `NEXTAUTH_SECRET` — Random 32+ char string (`openssl rand -base64 32`)

### Google OAuth

- `GOOGLE_CLIENT_ID` — From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` — From Google Cloud Console

### Redis (rate limit, cache, queue)

- `REDIS_URL` — Redis connection string
- `UPSTASH_REDIS_REST_URL` (if using Upstash)
- `UPSTASH_REDIS_REST_TOKEN` (if using Upstash)

### Storage

- `STORAGE_DRIVER` — `local` | `s3` | `r2`
- `STORAGE_LOCAL_PATH` — Dev only, e.g., `./uploads`
- `S3_BUCKET` — Prod
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT` — For R2 or custom S3-compatible

### Email (Resend)

- `RESEND_API_KEY`
- `EMAIL_FROM` — e.g., `"Acme <no-reply@acme.com>"`

### Observability

- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` (CI only, for sourcemap upload)
- `POSTHOG_KEY`
- `POSTHOG_HOST` — usually `https://app.posthog.com`

### App behavior

- `APP_ENV` — `development` | `staging` | `production`
- `APP_URL` — Canonical public URL
- `LOG_LEVEL` — `debug` | `info` | `warn` | `error`

## Required in production only

- `CRON_SECRET` — Shared secret for cron endpoint auth
- `ADMIN_EMAILS` — Comma-separated list of admin user emails

## Future (when Stripe added)

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_YEARLY`

## Validation

```ts
// lib/env.ts
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  STORAGE_DRIVER: z.enum(['local', 's3', 'r2']),
  STORAGE_LOCAL_PATH: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  POSTHOG_KEY: z.string().optional(),
  POSTHOG_HOST: z.string().url().optional(),
  APP_ENV: z.enum(['development', 'staging', 'production']),
  APP_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CRON_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
```

Import `env` from here instead of `process.env` anywhere in the app. Typed and guaranteed present.

## .env.example

Keep `.env.example` in sync. When adding a new var:

1. Add to this file
2. Add to `lib/env.ts` schema
3. Add to `.env.example` with a placeholder
4. Update RUNBOOK.md deploy checklist

## Google OAuth setup (step-by-step)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or pick existing)
3. APIs & Services → OAuth consent screen
   - User Type: External
   - Fill app name, support email, developer contact
   - Add scopes: `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. APIs & Services → Credentials → Create OAuth client ID
   - Application type: Web application
   - Authorized JavaScript origins: `http://localhost:3000` (and prod URL)
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (and prod URL)
5. Copy Client ID → `GOOGLE_CLIENT_ID`
6. Copy Client secret → `GOOGLE_CLIENT_SECRET`
