# SECURITY.md

## Threat model (what we defend against)

- Unauthorized access to another user's documents/annotations
- Account takeover via credential stuffing
- CSRF on authenticated endpoints
- XSS via document names, comments, tags
- File upload abuse (malware, oversized files, wrong types)
- Enumeration via timing or error-message leaks
- Share link guessing / enumeration
- Rate-limit bypass

## Auth hardening

- **Passwords:** bcrypt cost 12. Min 8 chars. Check against Have I Been Pwned k-anonymity API on signup and password change.
- **Session:** JWT with 30-day sliding expiry. Revocation via session id tracked in DB; middleware checks revocation on every request.
- **Sign-in rate limit:** 10/min per IP, 5/min per email.
- **Password reset:** token single-use, 1-hour expiry, invalidates on use.
- **Google OAuth:** verify `email_verified: true` claim.
- **Re-auth required for:** change email, change password, delete account, revoke all sessions.

## Input handling

- Zod at every API boundary.
- HTML in comments: strip all tags (plain text only) OR sanitize with DOMPurify if rich text is introduced later. Decide early.
- Filenames: sanitize to `[a-zA-Z0-9._-]`, max 200 chars.
- File uploads: validate MIME AND magic bytes (use `file-type` package). Whitelist: `application/pdf`, `image/png`, `image/jpeg`, `image/webp`. Max 50MB.
- PDF uploads: open with pdf.js in a worker; reject if parsing fails or if it contains executable content (embedded files, JavaScript actions — log these for review).

## Output handling

- React auto-escapes — never use `dangerouslySetInnerHTML` with user content.
- `rel="noopener noreferrer"` on any user-provided external links.
- Signed URLs for file downloads, expire in 15 min.

## Headers (set in middleware)

```
Content-Security-Policy: default-src 'self';
  script-src 'self' 'unsafe-inline' https://*.posthog.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  font-src 'self' data:;
  connect-src 'self' https://*.posthog.com https://*.sentry.io;
  frame-ancestors 'none';
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## CSRF

Auth.js handles CSRF for its own routes. For other mutating routes:

- SameSite=Lax cookies (default)
- Require `Origin` header match for POST/PATCH/DELETE
- JSON-only endpoints (reject `application/x-www-form-urlencoded`)

## Share links

- **Token:** 32 random bytes, base64url encoded (256-bit entropy)
- **Rate limit** share-link access by IP: 60/min
- **Optional password:** bcrypt-hashed, verified before serving
- **Expiry:** default 7 days, configurable up to 1 year
- **Revocable;** revocation is instant (cached with 60s TTL max)

## Secrets

- Never in code, never in logs, never in error messages.
- Rotate quarterly: `NEXTAUTH_SECRET`, webhook secrets.
- Immediately on suspected leak: all secrets + DB password + OAuth client secret.
- Pre-commit hook scans for accidentally committed secrets (e.g., gitleaks).

## Dependencies

- `npm audit` in CI on every PR; high/critical must be resolved.
- Dependabot enabled, grouped weekly.
- Pin lockfile; `npm ci` in deploy.
- New deps require DECISIONS.md entry justifying and assessing risk.

## Logging

- **Never log:** passwords, tokens, full session cookies, full file contents, full user emails (userId is fine).
- Redact at the logger level with a deny-list.

## Data handling

- TLS in transit everywhere. HTTPS enforced in prod (redirect HTTP).
- Database encrypted at rest (managed provider usually handles this).
- Backups encrypted at rest.
- User data export: signed URL, 24h expiry, one-time use token.
- Account deletion: 7-day grace, then cascade delete. PII in audit log replaced with `deleted-user-${originalId}`.

## Incident response

- Suspected breach → runbook step 1: revoke all sessions (`UPDATE sessions SET revokedAt = NOW()`).
- Customer notification within 72 hours of confirmed breach involving PII (GDPR requirement).
- Post-mortem within 7 days, published internally.

## Review checklist (every PR)

- [ ] No new `dangerouslySetInnerHTML`
- [ ] No new endpoint without auth + validation + rate limit
- [ ] No new query without userId scoping (unless explicitly public)
- [ ] No new env var without ENV.md update
- [ ] No new dep without DECISIONS.md entry
- [ ] No logged secrets/PII
