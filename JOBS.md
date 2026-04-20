# JOBS.md

## Queue

BullMQ on Redis. One queue per concern or shared queue with priority — start with one shared queue `main` and split later if one type starves others.

## Job catalog

### `document.postProcess`

- **Trigger:** on document create.
- **Work:**
  1. Generate thumbnail (first page → 400x520 WebP)
  2. Extract text per page, write to `DocumentText` rows (for search)
  3. Extract PDF outline → `DocumentOutline`
  4. Update `Document.status`: `PROCESSING` → `READY` (or `FAILED`)
- **Retries:** 3, exponential backoff starting at 30s.
- **Idempotent:** checks existing thumbnail/text before regenerating.

### `annotation.exportPdf`

- **Trigger:** user clicks "Download annotated PDF".
- **Work:** fetch PDF + annotations, flatten via pdf-lib, upload to storage, email signed link.
- **SLA:** 90s for 200-page PDF with 500 annotations.
- Creates an `ExportJob` row user can poll.

### `annotation.export`

- **Trigger:** user clicks "Export annotations".
- **Formats:** JSON, CSV, MD. Emits one file per format, zipped.
- Emails signed download link.

### `user.dataExport`

- **Trigger:** GDPR data export request.
- **Work:** assemble all user data into a zip (documents with originals, all annotations, tags, collections, audit log).
- **SLA:** 24 hours.
- Emails signed link, expires 48h.

### `user.purge`

- **Trigger:** cron (hourly).
- **Work:** hard-delete users whose `deletedAt` is > 7 days ago. Cascade to all owned data. Replace `userId` in AuditLog with sentinel value to preserve log integrity without PII.

### `document.purge`

- **Trigger:** cron (daily).
- **Work:** hard-delete documents + files where `deletedAt` > 30 days ago.

### `usage.reconcile`

- **Trigger:** cron (daily at 04:00 UTC).
- **Work:** for each user, recompute `documents` and `storageBytes` from source of truth; update Usage rows if drift detected; log drift to Sentry as a warning (indicates a bug somewhere).

### `share.cleanup`

- **Trigger:** cron (daily).
- **Work:** mark expired share links as revoked; hard-delete revoked links > 90 days old.

### `email.send`

- **Trigger:** any email dispatch.
- **Work:** calls Resend; retries 3x on failure; writes to EmailLog.
- All emails go through this queue so retries are uniform.

### `analytics.flush`

- **Trigger:** on buffer fill or every 10s.
- **Work:** flush buffered PostHog events from server-side.

## Job conventions

- Every job takes a payload object, not raw DB rows (payloads are durable; DB state changes).
- Every job handler has signature: `async (payload: Payload, job: Job) => Result`
- Every job logs start, end, duration with job id.
- Every job is idempotent — rerunning must be safe.
- Failed jobs land in a DLQ (dead-letter queue) after max retries; Sentry alert fires.
- Long jobs write progress to DB every 5% or 5s, whichever first, so UIs can poll.

## Scheduling

Define crons in one file `/lib/jobs/cron.ts` with cron expressions and links to handlers. Documented schedule:

```
purge-users        0 * * * *    hourly
purge-documents    0 3 * * *    daily 03:00 UTC
reconcile-usage    0 4 * * *    daily 04:00 UTC
cleanup-shares     0 5 * * *    daily 05:00 UTC
weekly-digest      0 12 * * 1   Monday 12:00 UTC
```

## Worker deployment

- Workers run as a separate process from the web app.
- Scale workers independently (e.g., 1 web replica, 2 worker replicas).
- Worker crash does not affect web requests.
- Health check endpoint returns queue depth; alert if > 1000 or if oldest waiting job > 5 min.

## Monitoring

- Queue depth per job type surfaced in admin dashboard.
- Job duration percentiles (p50, p95, p99).
- Failure rate alarm: > 5% over 1 hour pages on-call.
