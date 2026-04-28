# AGENTS.md

This file is the contract for Codex CLI working in this repo. Read it fully before any task.

## Project

Production SaaS: per-user PDF and image annotation / study tool.

**Stack:** Next.js 15 (App Router) + TypeScript + PostgreSQL (Prisma) + Redux Toolkit + RTK Query + Zustand + Tailwind + shadcn/ui + Auth.js v5.

## graphify

This project has a graphify knowledge graph at `graphify-out/`.

Rules:
- Before answering architecture or codebase questions, read `graphify-out/GRAPH_REPORT.md` for god nodes and community structure
- If `graphify-out/wiki/index.md` exists, navigate it instead of reading raw files
- The graph is gitignored — if `graphify-out/` is missing, run `graphify update .` first (requires `pip install graphifyy`)

## Non-negotiables

1. Every DB query touching user-owned data MUST filter by `session.user.id`. No exceptions.
2. Every mutating API route MUST: authenticate, rate-limit, validate input with Zod, check quotas, write an audit log entry.
3. Every user-facing feature MUST work in both light and dark mode and be keyboard-accessible.
4. Soft delete only for Document and Annotation. Never hard-delete from API routes.
5. No secrets in code. All config via env vars.
6. No `any`. No `@ts-ignore` without a comment explaining why.
7. No `prisma db push` ever. Migrations only.

## Source of truth docs

- **ARCHITECTURE.md** — system design, schema, decisions
- **AUTHORIZATION.md** — auth and ownership rules (read before any DB query or API route)
- **FRONTEND.md** — UI, components, accessibility, theming
- **STATE.md** — Redux Toolkit, RTK Query, Zustand patterns
- **BACKEND.md** — API routes, validation, errors
- **DATABASE.md** — Prisma, migrations, queries
