# RULES_SUMMARY.md

Quick-reference contract for working in this repo. Read alongside the source docs when implementing anything non-trivial.

## Repo-wide non-negotiables

- Scope all user-owned data access by authenticated `session.user.id`; never trust `userId` from params/body, and return `404` on ownership misses to avoid existence leaks. User-owned models include `Document`, `Annotation`, `Tag`, `Collection`, `Bookmark`, `ReadingProgress`, `ShareLink`, `Usage`, and `AuditLog`. (`CLAUDE.md`, `AUTHORIZATION.md`)
- Every mutating API handler follows this order: authenticate, rate-limit, validate with Zod, authorize ownership, enforce entitlements with `assertCanPerform`, execute business logic, write audit log, emit analytics, return typed response. (`CLAUDE.md`, `BACKEND.md`)
- All DB access to user-owned models goes through repositories in `/lib/db/repositories`; route handlers must not use raw Prisma model clients directly. (`AUTHORIZATION.md`, `DATABASE.md`)
- No `any`, no unexplained `@ts-ignore`, no secrets in code, no `prisma db push`, and no new dependency without a justification entry in `DECISIONS.md`. (`CLAUDE.md`, `SECURITY.md`, `ENV.md`, `DATABASE.md`)
- `Document` and `Annotation` use soft delete only in product flows; API routes never hard-delete them. Purge happens later via jobs. (`CLAUDE.md`, `DATABASE.md`, `JOBS.md`, `DECISIONS.md`)
- Every user-facing feature must work in light and dark mode, be keyboard-accessible, and give clear hover/focus/active/disabled states. Every new interactive element must be added to the interaction table in `FRONTEND.md`. (`CLAUDE.md`, `FRONTEND.md`)

## Architecture and state boundaries

- App routes stay thin; business logic lives in feature services, framework-agnostic code belongs in `lib/*`, and `components/ui/*` stays as unmodified shadcn primitives. (`ARCHITECTURE.md`)
- State has three fixed layers:
  - RTK Query for all server state and fetching.
  - Redux Toolkit slices for persistent app-wide client state such as theme, toasts, modals, command palette, and session mirror.
  - Zustand for per-viewer ephemeral high-frequency state such as zoom, page, tool selection, draft annotations, and panel state. (`ARCHITECTURE.md`, `STATE.md`)
- Forms use `react-hook-form` + shared Zod schemas. Shareable UI state prefers the URL. (`ARCHITECTURE.md`, `FRONTEND.md`)

## Backend, authz, and data rules

- Read auth state with `requireUser()` in server components and route handlers. Never accept ownership from request payloads. (`AUTHORIZATION.md`)
- Share links are the only public document-access exception: authorize by secure token, keep the experience strictly read-only, and rate-limit by IP. (`AUTHORIZATION.md`, `SECURITY.md`)
- Use typed `AppError` classes and a central error handler. Error responses must follow the strict `{ error: { code, message, details } }` shape. (`BACKEND.md`)
- Zod validates every API boundary. File uploads validate MIME type and magic bytes; PDFs are parsed safely and rejected if malformed or executable. (`BACKEND.md`, `SECURITY.md`)
- Use `prisma.$transaction` for multi-write operations that must stay consistent, especially around usage counters, soft delete flows, and parent/child writes. (`BACKEND.md`, `DATABASE.md`)
- Schema truth lives in `/prisma/schema.prisma`; every user-owned model has `userId` plus required indexes, and anything large must be paginated and queried selectively. (`DATABASE.md`)

## Frontend and UX contract

- Default to Server Components; add `"use client"` only when interactivity requires it. Keep client components small. (`FRONTEND.md`)
- Never hardcode colors; use semantic theme tokens. Theme state lives in Redux, persists locally, respects system theme on first visit, and must avoid theme flash before paint. (`FRONTEND.md`)
- All forms, pages, and data-bound components must handle loading, error, empty, and success states. (`FRONTEND.md`)
- Accessibility is baseline, not optional: labels, alt text, DOM-order focus, skip link, `aria-live`, zero axe violations, WCAG AA contrast in both themes. (`FRONTEND.md`, `TESTING.md`)
- Heavy UI like the PDF viewer must be dynamically imported, lists over 50 items virtualized, and images rendered with `next/image`. (`FRONTEND.md`, `PERFORMANCE.md`)

## Annotation engine contract

- Store annotation coordinates only in source space, never screen space; PDFs use PDF points and images use original pixels. Rotation is applied only at render time. (`ANNOTATIONS.md`)
- Text annotations persist rects plus `quotedText`, `prefix`, and `suffix` to support re-anchoring if the PDF text layer shifts. Failed re-anchors become orphaned annotations with a relocate affordance. (`ANNOTATIONS.md`)
- Annotation endpoints must verify both annotation ownership and parent document ownership. Quotas for creation are enforced via `assertCanPerform(userId, "annotation.create", { documentId })`. (`ANNOTATIONS.md`)
- Annotation UX requires optimistic updates, debounced autosave, save-on-blur, unload flush, undo/redo per viewer session, and hover/click/focus behaviors defined in the frontend contract. (`ANNOTATIONS.md`, `STATE.md`, `FRONTEND.md`)

## Jobs, analytics, performance, and ops

- Jobs handle all work above 200ms, retriable work, and file-producing work. Jobs must be idempotent, payload-based, logged, retried up to 3 times, and progress-aware for long tasks. (`BACKEND.md`, `JOBS.md`)
- Product analytics are typed through a fixed event union. Never send PII in event props, never track in development, and honor consent / DNT rules. (`ANALYTICS.md`)
- Performance budgets are explicit: keep app JS lean, app routes fast, viewer FPS high, memory bounded, and query plans indexed. Measure with Lighthouse CI, Sentry Performance, bundle analysis, React Profiler, Chrome Performance, and `EXPLAIN ANALYZE`. (`PERFORMANCE.md`)
- Testing is mandatory across handlers, services, reducers, RTK Query tags, forms, annotation persistence, share links, soft delete, and account deletion. Cross-user 404 tests are required for every user-owned resource. (`TESTING.md`, `AUTHORIZATION.md`, `BACKEND.md`)
- Operations assume daily backups, quarterly restore drills, forward-only migrations, incident playbooks, queue monitoring, and quarterly secret rotation. (`DATABASE.md`, `RUNBOOK.md`, `SECURITY.md`)

## Current standing decisions

- State is intentionally split across RTK Query, Redux Toolkit, and Zustand.
- shadcn/ui was chosen over headless alternatives.
- Plans, usage, and entitlement scaffolding exist from day one even on a free-only launch.
- Soft delete uses a 30-day grace period for `Document` and `Annotation`. (`DECISIONS.md`)

## Done checklist for implementation phases

- `npm run typecheck`
- `npm run lint`
- `npm run test` for affected scope
- `npm run build`
- Manual light/dark verification
- Keyboard-only walkthrough
- No console errors
- Cross-user access test for new user-owned resources (`CLAUDE.md`, `TESTING.md`)
