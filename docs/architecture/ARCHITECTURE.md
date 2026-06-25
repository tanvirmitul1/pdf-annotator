# ARCHITECTURE.md

Living document. Update when structure changes.

## Stack

- Next.js 15, App Router, React Server Components where possible
- TypeScript strict mode
- PostgreSQL 15+ via Prisma
- Auth.js v5 (Google OAuth + Credentials, JWT sessions)
- Redux Toolkit + RTK Query (server state, global client state)
- Zustand (ephemeral viewer/editor state only)
- Tailwind CSS + shadcn/ui (Radix primitives)
- react-pdf (PDF rendering) + pdf.js
- fabric.js OR konva.js (image annotation — decide in DECISIONS.md)
- BullMQ + Redis (background jobs) OR Inngest
- Upstash Ratelimit
- Resend (transactional email)
- Sentry (errors), PostHog (product analytics)
- Cloudflare R2 or S3 (production storage), local disk (dev)

## Folder structure

```
/app
  /(auth)/login, /(auth)/signup
  /(marketing)/page, /terms, /privacy
  /(app)/dashboard, /(app)/documents/[id], /(app)/settings, /(app)/trash
  /api/auth/[...nextauth], /api/documents, /api/annotations, /api/share, ...
  layout.tsx, providers.tsx
/components
  /ui            — shadcn primitives (unmodified)
  /common        — reusable app components
  /viewer        — PDF and image viewer
  /annotations   — annotation tools and panels
  /marketing     — landing / legal page components
/features        — feature slices (see STATE.md)
  /auth, /documents, /annotations, /tags, /collections, /share, /billing
/lib
  /auth          — session helpers, requireUser
  /authz         — assertCanPerform, plan helpers
  /db            — prisma client, repositories
  /storage       — StorageAdapter + implementations
  /jobs          — queue definitions and workers
  /email         — transactional templates
  /analytics     — event taxonomy and trackers
  /ratelimit     — limiter configs
  /errors        — typed error classes
  /validation    — shared Zod schemas
/hooks           — shared React hooks
/store           — Redux store, RTK Query base API, slices index
/styles          — globals.css, tailwind.css
/tests           — unit and integration tests
/prisma          — schema.prisma, migrations, seed.ts
/public
/scripts         — one-off scripts (seeding, backfills)
```

## Boundaries

- `app/*` is thin — route handlers delegate to feature modules.
- `features/*` contain UI components, hooks, RTK Query endpoints, Zod schemas for that domain. No cross-feature imports except through a feature's public `index.ts`.
- `lib/*` is framework-agnostic where possible.
- `components/ui/*` is unmodified shadcn. Customize by composing, not editing these files.

## Data flow

- **Server state:** RTK Query only. Components never fetch directly.
- **Global client state:** Redux slices (auth, theme, toasts, modals).
- **Ephemeral state (viewer zoom, active tool, draft annotation):** Zustand.
- **Form state:** react-hook-form + Zod.
- **URL state:** Next.js router + searchParams. Prefer URL for shareable UI state.

## Caching

- RTK Query cache keyed by tag. See STATE.md for tag taxonomy.
- Server: `unstable_cache` for expensive reads where appropriate.
- Redis cache for plan, usage, entitlements (TTL 60s).

## Plan / entitlements model

Even with everyone on free today, the SaaS scaffolding must exist from day one.

- `Plan` table seeded with `free` having limits: `maxDocuments`, `maxStorageMB`, `maxAnnotationsPerDoc`, `maxShareLinks`, `allowedFeatures` (array).
- Every User has `planId`, `trialEndsAt`, `subscriptionStatus`, `stripeCustomerId` (nullable; used later).
- Usage tracked per user per metric in `Usage` table. Increment on create, decrement on hard delete, reconcile nightly.
- `assertCanPerform(userId, action, context)` throws `QuotaExceededError` or `FeatureGatedError`.
