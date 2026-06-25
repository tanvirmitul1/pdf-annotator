# BACKEND.md

## API routes

### Structure

All API routes under `/app/api`. One route file = one URL. Handlers delegate to feature services in `/features/<domain>/service.ts`.

### Every mutating handler MUST, in order

1. **Authenticate** — `const user = await requireUser()` (401 if missing)
2. **Rate-limit** — `await enforceRateLimit(req, user.id, 'bucket-name')`
3. **Validate** — `const input = Schema.parse(await req.json())`
4. **Authorize** — ownership check via repository
5. **Entitlement** — `await assertCanPerform(user.id, 'action', ctx)`
6. **Execute** — call service function (transaction if multi-write)
7. **Audit** — `await logAudit({ userId, action, resource, metadata })`
8. **Analytics** — `track(user.id, 'event.name', payload)`
9. **Respond** — typed success or typed error

Read handlers skip rate-limit-bucket choice (still apply global), entitlement (usually), and audit log.

### Canonical handler template

```ts
// app/api/documents/route.ts
import { withErrorHandling } from '@/lib/api/handler';
import { requireUser } from '@/lib/auth/require';
import { enforceRateLimit } from '@/lib/ratelimit';
import { assertCanPerform } from '@/lib/authz/assert';
import { logAudit } from '@/lib/audit';
import { track } from '@/lib/analytics';
import { createDocument } from '@/features/documents/service';
import { CreateDocumentSchema } from '@/features/documents/schema';

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser();                                // 1. auth
  await enforceRateLimit(req, user.id, 'upload');                  // 2. limit
  const input = CreateDocumentSchema.parse(await req.json());      // 3. validate
  await assertCanPerform(user.id, 'document.create', {             // 4. quota
    fileSize: input.fileSize
  });

  const doc = await createDocument(user.id, input);                // 5. exec

  await logAudit({                                                 // 6. audit
    userId: user.id,
    action: 'document.create',
    resourceType: 'Document',
    resourceId: doc.id,
    metadata: { fileSize: doc.fileSize, pageCount: doc.pageCount },
  });
  track(user.id, 'document_uploaded', {                            // 7. analytics
    pageCount: doc.pageCount,
    sizeMb: Math.round(doc.fileSize / 1024 / 1024),
  });

  return NextResponse.json({ data: doc }, { status: 201 });        // 8. respond
});
```

### Responses

**Success:** `NextResponse.json({ data })` with appropriate status.

**Error:** use `/lib/errors` typed classes. A central error handler converts them to JSON.

**Error shape (strict):**

```json
{
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "human readable",
    "details": { "metric": "documents", "limit": 10, "current": 10 }
  }
}
```

**Standard codes:** `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_FAILED`, `QUOTA_EXCEEDED`, `FEATURE_GATED`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL`.

**Status codes:**
- 400 (validation)
- 401 (no auth)
- 402 (quota/feature gate)
- 403 (forbidden non-ownership case, rare)
- 404 (not found / ownership miss)
- 409 (conflict)
- 429 (rate limited)
- 500 (internal)

### Validation

- Zod schemas in `features/<domain>/schema.ts`, imported by both frontend form and backend handler.
- Parse at the boundary. Never trust `req.body` deeper in.
- File uploads: validate MIME and magic bytes, not just extension.

## Typed errors (`/lib/errors`)

```ts
// lib/errors/index.ts
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthenticatedError extends AppError {
  constructor() { super('UNAUTHENTICATED', 401, 'Not signed in'); }
}

export class ForbiddenError extends AppError {
  constructor(msg = 'Forbidden') { super('FORBIDDEN', 403, msg); }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('NOT_FOUND', 404, `${resource} not found`);
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, unknown>) {
    super('VALIDATION_FAILED', 400, 'Invalid input', details);
  }
}

export class QuotaExceededError extends AppError {
  constructor(metric: string, limit: number, current: number) {
    super('QUOTA_EXCEEDED', 402, `${metric} quota exceeded`,
      { metric, limit, current, upgradeUrl: '/app/settings/plan' });
  }
}

export class FeatureGatedError extends AppError {
  constructor(feature: string) {
    super('FEATURE_GATED', 402, `${feature} not available on your plan`,
      { feature, upgradeUrl: '/app/settings/plan' });
  }
}

export class RateLimitedError extends AppError {
  constructor(retryAfter: number) {
    super('RATE_LIMITED', 429, 'Too many requests', { retryAfter });
  }
}

export class ConflictError extends AppError {
  constructor(msg: string) { super('CONFLICT', 409, msg); }
}

export type ErrorCode =
  | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND'
  | 'VALIDATION_FAILED' | 'QUOTA_EXCEEDED' | 'FEATURE_GATED'
  | 'RATE_LIMITED' | 'CONFLICT' | 'INTERNAL';
```

## Central error handler

```ts
// lib/api/handler.ts
export function withErrorHandling<T>(
  handler: (req: NextRequest, ctx: T) => Promise<Response>
) {
  return async (req: NextRequest, ctx: T) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

function toErrorResponse(err: unknown): Response {
  if (err instanceof ZodError) {
    return NextResponse.json({
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid input',
        details: err.flatten().fieldErrors,
      }
    }, { status: 400 });
  }

  if (err instanceof AppError) {
    const headers = err instanceof RateLimitedError
      ? { 'Retry-After': String(err.details?.retryAfter ?? 60) }
      : undefined;
    return NextResponse.json({
      error: { code: err.code, message: err.message, details: err.details }
    }, { status: err.status, headers });
  }

  // Unknown: log to Sentry, return generic
  Sentry.captureException(err);
  return NextResponse.json({
    error: { code: 'INTERNAL', message: 'Something went wrong' }
  }, { status: 500 });
}
```

## Services

`/features/<domain>/service.ts` contains business logic. Services:

- Take already-validated input
- Take a `userId` (never accept session directly)
- Use repositories for DB access
- Throw typed errors, never return error objects
- Are unit-testable without HTTP context

### Service template

```ts
// features/documents/service.ts
export async function createDocument(
  userId: string,
  input: CreateDocumentInput
): Promise<Document> {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.document.create({
      data: { ...input, userId, status: 'PROCESSING' },
    });

    await tx.usage.upsert({
      where: { userId_metric: { userId, metric: 'documents' } },
      create: { userId, metric: 'documents', value: 1 },
      update: { value: { increment: 1 } },
    });
    await tx.usage.upsert({
      where: { userId_metric: { userId, metric: 'storageBytes' } },
      create: { userId, metric: 'storageBytes', value: input.fileSize },
      update: { value: { increment: input.fileSize } },
    });

    await enqueueJob('document.postProcess', { documentId: doc.id });

    return doc;
  });
}
```

## Background jobs

### When to enqueue

Anything > 200ms of work, anything that can be retried, anything that produces a file:

- Thumbnail generation
- PDF text extraction (for search)
- Annotated-PDF export
- Annotation export (JSON/CSV/MD)
- Account data export
- Email sending (via transactional provider, but retries in worker)
- Usage reconciliation (cron)
- Soft-delete purge (cron, 30-day)
- Share link cleanup (cron)

### Rules

- Jobs are idempotent. Re-running must be safe.
- Jobs take a payload, not a Prisma object.
- Jobs log start, success, failure with job id.
- Failed jobs go to a DLQ after max retries (3).
- Long jobs update a progress record users can poll.

## Rate limiting

Per-user buckets in Redis (Upstash or similar):

- `auth`: 10 req / min (login, signup, reset)
- `upload`: 20 req / hour
- `annotation-write`: 300 req / min (annotation creates are chatty)
- `default`: 120 req / min

Return 429 with `Retry-After` header.

## Quotas and entitlements

Central helper `assertCanPerform(userId, action, ctx)` in `/lib/authz`.

**Actions:** `document.create`, `annotation.create`, `share.create`, `export.run`, feature-name for gated features.

**Implementation:**

1. Load plan (cached 60s in Redis)
2. Load current usage
3. Compare to plan limits
4. Throw `QuotaExceededError` or `FeatureGatedError` with context that frontend uses to show the upgrade CTA

Usage tracked eventually-consistent: increment on create, decrement on soft-delete undo/purge, reconcile nightly via cron job.

## Transactions

Use `prisma.$transaction` when:

- Creating a parent + children atomically
- Decrementing usage + soft-deleting a resource
- Anything where partial success would corrupt state

## Logging

- Structured logs (pino). Include `requestId`, `userId`, `route`.
- No PII in logs beyond `userId`.
- Errors also go to Sentry with context.

## Secrets

- All secrets via env. Loaded through a typed `env.ts` that validates with Zod at boot. App refuses to start on invalid env.
- Never log secrets. Never return them in API responses.

## Webhook endpoints

Webhook handlers (Stripe, email provider, etc.) MUST:

1. Verify signature before parsing body
2. Return 200 even on business-logic errors (just log them) — webhook providers retry otherwise
3. Be idempotent (use event id as dedup key in a WebhookEvent table)
4. Respond within 5 seconds (enqueue heavy work)

## API versioning

Start with unversioned `/api/*`. If a breaking change is needed, introduce `/api/v2/*` and keep `/api/*` working for ≥6 months. Document deprecation in CHANGELOG.md.

## Tests required per endpoint

- Happy path
- Unauthenticated → 401
- Cross-user access → 404
- Validation failure → 400
- Quota exceeded → 402 (for quota-gated endpoints)
