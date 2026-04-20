# CLAUDE.md

This file is the contract for working in this repo. Read it fully before any task. If a request conflicts with these rules, stop and ask.

## Project

Production SaaS: per-user PDF and image annotation / study tool.

**Stack:** Next.js 15 (App Router) + TypeScript + PostgreSQL (Prisma) + Redux Toolkit + RTK Query + Zustand + Tailwind + shadcn/ui + Auth.js v5.

## Source of truth docs (read when relevant)

- **ARCHITECTURE.md** — system design, schema, decisions
- **AUTHORIZATION.md** — auth and ownership rules (ALWAYS read before any DB query or API route)
- **FRONTEND.md** — UI, components, accessibility, theming
- **STATE.md** — Redux Toolkit, RTK Query, Zustand patterns
- **BACKEND.md** — API routes, validation, errors, background jobs
- **DATABASE.md** — Prisma, migrations, indexes, queries
- **ENV.md** — environment variables, validation
- **SECURITY.md** — threat model, hardening
- **ANNOTATIONS.md** — annotation engine contract
- **JOBS.md** — background job catalog
- **ANALYTICS.md** — event taxonomy
- **PERFORMANCE.md** — budgets and measurement
- **TESTING.md** — what to test and how
- **RUNBOOK.md** — operational procedures
- **DECISIONS.md** — append-only log of non-obvious choices

## Non-negotiables

1. Every DB query touching user-owned data MUST filter by `session.user.id`. No exceptions. See AUTHORIZATION.md.
2. Every mutating API route MUST: authenticate, rate-limit, validate input with Zod, check quotas via `assertCanPerform`, write an audit log entry, return typed errors.
3. Every user-facing feature MUST work in both light and dark mode and be keyboard-accessible.
4. Every interactive element MUST have both hover and click affordances per the interaction spec in FRONTEND.md.
5. Soft delete only for Document and Annotation. Never hard-delete from API routes.
6. No secrets in code. All config via env vars. Update `.env.example` when adding new vars.
7. No `any`. No `@ts-ignore` without a comment explaining why.
8. No `prisma db push` ever. Migrations only.
9. No new dependency without justifying it in DECISIONS.md.
10. Every new interactive element requires a row in the FRONTEND.md interaction table.

## Workflow per task

1. State the goal in one sentence.
2. List files you will create or modify.
3. Identify which rules files apply.
4. Implement.
5. Run: typecheck, lint, tests, build. All must pass.
6. Summarize changes and any DECISIONS.md entries.

## Done means

- `npm run typecheck` green
- `npm run lint` green
- `npm run test` green (affected tests)
- `npm run build` green
- Feature manually verified in both light and dark mode
- Keyboard-only walkthrough works
- No console errors or warnings
- Cross-user access test exists for any new user-owned resource
