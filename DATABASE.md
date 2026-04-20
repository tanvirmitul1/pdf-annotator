# DATABASE.md

## Prisma rules

- Schema in `/prisma/schema.prisma` is the single source of truth.
- Migrations via `prisma migrate dev` (dev) / `prisma migrate deploy` (prod/CI). **Never** `db push` outside throwaway experiments.
- Every migration reviewed in PR. No manual SQL without a migration.
- Seed script (`/prisma/seed.ts`) seeds the Free plan. Idempotent.

## Schema conventions

- `id`: `String @id @default(cuid())` on every model.
- `createdAt`: `DateTime @default(now())`.
- `updatedAt`: `DateTime @updatedAt`.
- `deletedAt`: `DateTime?` for soft-deletable models.
- Foreign keys: `userId String` + `user User @relation(...)`.
- Enums in schema, not strings.
- JSONB (`Json`) for flexible payloads; exact TS type documented in `/features/<domain>/types.ts`.

## Required models

### Auth (Auth.js managed)
- User, Account, Session, VerificationToken

### SaaS foundations
- **Plan** (id, name, price, limits as JSON)
- User fields: `planId`, `trialEndsAt`, `subscriptionStatus`, `stripeCustomerId` (nullable, used later)
- **Usage** (userId, metric, value, periodStart) — for quota tracking

### Core product
- **Document** — userId FK (indexed), `deletedAt` for soft delete, `pageCount`, `fileSize`, `storageKey`, `thumbnailKey`, `lastOpenedAt`, `status`
- **Annotation** — userId, documentId, pageNumber, type enum, color, `positionData` JSONB, content, createdAt, updatedAt, deletedAt
- **AnnotationType enum:** HIGHLIGHT, UNDERLINE, STRIKETHROUGH, SQUIGGLY, NOTE, FREEHAND, RECTANGLE, CIRCLE, ARROW, TEXTBOX, IMAGE_SHAPE
- **Tag**, **AnnotationTag** (join)
- **Collection**, **DocumentCollection** (join)
- **Bookmark** (userId, documentId, pageNumber, label)
- **ReadingProgress** (userId, documentId, lastPage, percentComplete, lastReadAt)
- **ShareLink** (id, documentId, token, createdBy, expiresAt, viewCount, revokedAt, passwordHash?)
- **AuditLog** (userId, action, resourceType, resourceId, metadata JSONB, ipAddress, createdAt)
- **DocumentText** (documentId, pageNumber, text, tsv tsvector) — for full-text search
- **DocumentOutline** (documentId, entries JSONB)
- **ExportJob** (userId, kind, status, payload, resultKey, error, progress, createdAt)
- **WebhookEvent** (provider, eventId UNIQUE, payload, processedAt)
- **EmailLog** (userId, template, status, provider, providerId, error, createdAt)

Every user-owned model has `userId` FK + index. Justify JSONB choices in DECISIONS.md.

## Indexes (required)

- Every `userId` column: `@@index([userId])`.
- Every soft-deleted model: `@@index([userId, deletedAt])`.
- Foreign keys: indexed.
- Join tables: composite `@@unique` on the pair.
- Search columns: GIN index via migration for tsvector.
- Document listing: `@@index([userId, lastOpenedAt(sort: Desc)])`.

Run `EXPLAIN ANALYZE` on any query that will run on lists > 1000 rows. Document slow queries and their plans in PERFORMANCE.md.

## Query rules

- Use repositories (see AUTHORIZATION.md). No raw Prisma in routes.
- Always `select` only the fields needed. No `SELECT *`.
- Paginate anything that could exceed 50 rows. Cursor pagination preferred over offset.
- Watch for N+1. Use `include` or batch queries.
- For counts, prefer `prisma.x.count` over `findMany().length`.

## Transactions

Wrap multi-write operations:

```ts
await prisma.$transaction(async (tx) => {
  await tx.document.update({
    where: { id },
    data: { deletedAt: new Date() }
  });
  await tx.usage.update({
    where: { userId_metric: { userId, metric: 'documents' } },
    data: { value: { decrement: 1 } }
  });
  await tx.auditLog.create({ data: { /* ... */ } });
});
```

## Migrations

- Named descriptively: `add_reading_progress`, not `update`.
- Destructive migrations (drop column, rename) require a two-step deploy: add new + dual-write → backfill → switch reads → drop old.
- Always test migration on a copy of prod data before deploying.

## Backups

- Automated daily backups (managed by host or `pg_dump` cron).
- 30-day retention.
- Quarterly restore drill documented in RUNBOOK.md.

## PII and data export

- On account deletion: 7-day grace, then hard delete cascading to all user-owned data. Anonymize audit log entries (keep userId replaced with `deleted-user-${originalId}` but preserve the log for integrity).
- On data export: job assembles all user rows into a zip, emails signed download link (expires 24h).

## Full-text search

- Use Postgres `tsvector` + GIN index.
- DocumentText table stores page-level text with `tsv` column.
- Annotation content also tsvectored.
- Search query: use `plainto_tsquery` or `websearch_to_tsquery` for user input (safe against injection).
