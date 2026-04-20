# RUNBOOK.md

## Local dev

1. `cp .env.example .env` and fill
2. `docker compose up -d` (postgres + redis)
3. `npm install`
4. `npx prisma migrate dev`
5. `npm run seed`
6. `npm run dev`

## Incident playbook

### Users report data loss

1. Check AuditLog for recent destructive actions.
2. Check if soft-deleted (`deletedAt` set) → restore endpoint.
3. If purged, check last backup; restore to staging, extract rows.

### Error rate spike

1. Sentry → identify exception
2. Check recent deploys → rollback if correlated
3. Check DB connection pool, Redis, storage provider status

### Quota enforcement bug (users blocked wrongly)

1. Check plan cache (Redis) — flush if stale
2. Run usage reconciliation job manually
3. Audit Usage rows for the user

### Suspected security breach

1. Revoke all active sessions: `UPDATE sessions SET revokedAt = NOW()`
2. Rotate `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, DB password
3. Check AuditLog for anomalous activity (mass downloads, unusual IPs)
4. Preserve logs; engage security lead
5. If PII confirmed compromised, notify affected users within 72 hours (GDPR)

### Worker queue stalled

1. Check Redis connectivity
2. Check worker logs for OOM or unhandled exceptions
3. Restart workers; verify oldest job starts processing
4. If > 1000 backlog, scale workers temporarily

## Deployment

- PRs merged to `main` auto-deploy to staging
- Tagged releases deploy to prod
- Migrations run automatically via `prisma migrate deploy`
- Rollback: revert tag, redeploy. For migrations, forward-only — write a compensating migration.

## Secrets rotation

- **Quarterly:** `NEXTAUTH_SECRET`, webhook signing secrets
- **Immediately on suspected leak:** all of the above + OAuth client secret + DB password + API keys

## Backup verification

- Nightly backup confirmed by monitoring (row count check vs previous night).
- Quarterly restore drill: pick a random backup, restore to staging, verify key tables readable and sample user can log in.

## On-call

- Primary: engineer A
- Secondary: engineer B
- Escalation: post in #incident channel, page via Slack
- SLO: P1 (site down, data loss) response within 15 min; P2 (degraded) within 1 hour

## Monitoring alerts

- Site down: uptime robot → page immediately
- Error rate > 1% over 5 min: page
- API p95 > 1s over 5 min: page
- Queue depth > 1000: page
- Failed job rate > 5% over 1 hour: page
- Disk usage > 85%: warn
- DB connections > 80%: warn
