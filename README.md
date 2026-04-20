# PDF Annotator SaaS — Rules & Prompts Bundle

Complete documentation bundle for building a production-grade, per-user PDF and image annotation SaaS using Next.js 15 + TypeScript + PostgreSQL + Redux Toolkit + RTK Query + Zustand + shadcn/ui + Tailwind + Auth.js.

## What's in this bundle

### `rules/` — drop into your repo root

These files are Claude Code's reference material. It reads them on every session and works within their constraints.

- **CLAUDE.md** — master file; the non-negotiables. Auto-read by Claude Code.
- **ARCHITECTURE.md** — stack, folder structure, data flow
- **AUTHORIZATION.md** — per-user access enforcement
- **FRONTEND.md** — UI patterns, interaction contract, theming
- **STATE.md** — Redux Toolkit + RTK Query + Zustand patterns
- **BACKEND.md** — API route conventions, typed errors, handler template
- **DATABASE.md** — Prisma rules, schema conventions, indexes
- **ENV.md** — environment variables, validation, Google OAuth setup
- **SECURITY.md** — threat model, hardening checklist
- **ANNOTATIONS.md** — annotation engine contract (position data, rendering, re-anchoring)
- **JOBS.md** — background job catalog, cron schedules
- **ANALYTICS.md** — event taxonomy, typed tracker
- **PERFORMANCE.md** — budgets, measurement protocol
- **TESTING.md** — test templates (API, cross-user, RTK Query, e2e)
- **RUNBOOK.md** — local dev, incident playbook, deployment
- **DECISIONS.md** — append-only log template for architectural decisions

### `prompts/` — run these in order with Claude Code

One phase per file. Each contains: Goal, Rules to follow, the literal Prompt to paste into Claude Code, and What to verify before moving on.

- **PHASE_00_setup.md** — have Claude Code read all rules and produce a summary
- **PHASE_01_scaffold.md** — Next.js init, auth (Google OAuth + credentials), plans, entitlements, rate limiting, error infrastructure
- **PHASE_01_5_settings.md** — settings page, email, legal pages, account deletion flow
- **PHASE_02_upload.md** — document upload with quotas, soft delete, background thumbnails
- **PHASE_03_viewer.md** — production PDF viewer (virtualized, TOC, search, bookmarks, progress)
- **PHASE_04_annotations.md** — full PDF annotation suite (10 tools, hover/click, comments, tags)
- **PHASE_05_image_annotation.md** — image annotation with konva
- **PHASE_06_tags_collections_search.md** — organization layer + global search
- **PHASE_07_share_export.md** — share links, export formats, annotated PDF download
- **PHASE_08_saas_infra.md** — operational jobs, audit log viewer, admin, monitoring
- **PHASE_09_onboarding_mobile_a11y.md** — first-run tour, mobile responsive, WCAG AA
- **PHASE_10_performance.md** — measure and hit all performance budgets
- **PHASE_11_stripe.md** — Stripe subscriptions (run when ready to charge)

## How to use this bundle

### 1. Set up your repo

```bash
mkdir pdf-annotator
cd pdf-annotator
git init
# copy all files from rules/ into repo root
# put prompts/ folder aside for reference (don't commit it to the repo;
# it's your playbook, not Claude Code's input)
```

Your repo root should contain all the `.md` files from `rules/`:

```
pdf-annotator/
├── CLAUDE.md
├── ARCHITECTURE.md
├── AUTHORIZATION.md
├── FRONTEND.md
├── STATE.md
├── BACKEND.md
├── DATABASE.md
├── ENV.md
├── SECURITY.md
├── ANNOTATIONS.md
├── JOBS.md
├── ANALYTICS.md
├── PERFORMANCE.md
├── TESTING.md
├── RUNBOOK.md
└── DECISIONS.md
```

### 2. Start Phase 0

Open Claude Code in this empty repo. Paste the prompt from `PHASE_00_setup.md`. Wait for Claude Code to produce `RULES_SUMMARY.md` and confirm it understood the rules. Review its summary.

### 3. Run each phase in order

For each phase:

1. Open the matching `PHASE_XX_*.md` file.
2. Copy the prompt from the code block.
3. Paste into Claude Code.
4. Wait for it to complete.
5. Run through the "What to verify" checklist yourself.
6. Actually use the app for 15 minutes. Catch things the prompts can't anticipate.
7. Commit to git before starting the next phase.

### 4. Between phases

- Update `DECISIONS.md` with any non-obvious choices.
- Update rules files if you discover recurring patterns Claude Code keeps needing to be told.
- If friction appears, write a short "Phase N.5" prompt with your own findings.

## Suggested timeline

This is not a weekend project. Realistic estimates:

- Phase 0 + 1 + 1.5: 3-5 days
- Phase 2: 2-3 days
- Phase 3 (PDF viewer): 4-7 days
- Phase 4 (annotations): 7-14 days ← hardest phase
- Phase 5: 3-5 days
- Phase 6: 3-5 days
- Phase 7: 4-7 days
- Phase 8: 3-5 days
- Phase 9: 3-5 days
- Phase 10: 3-5 days
- Phase 11: 2-3 days (skip until ready to charge)

**Total: 6-10 weeks of focused work** before you have a production-ready free tier. Stripe integration is another few days on top.

## Key principles (from CLAUDE.md)

1. Every DB query filters by userId. No exceptions.
2. Every mutating API route does the 9 steps (auth, rate limit, validate, authorize, entitlement, execute, audit, analytics, respond).
3. Every interactive element has both hover AND click affordances.
4. Every feature works in light and dark mode.
5. Soft delete for Document and Annotation. Never hard-delete from API routes.
6. No secrets in code. All env vars validated at boot.
7. No `any`. No `prisma db push`. No new deps without justification.

## Tips for working with Claude Code

- **Reference only relevant rules per phase** to save context budget. The prompts already do this.
- **Be pedantic early.** If Phase 1 ships without audit logging, every phase after will too. Claude Code pattern-matches on what's already in the repo.
- **Commit after every passing phase.** Don't let one broken phase block the next.
- **When Claude Code makes a decision not covered by the rules**, have it add to `DECISIONS.md` and, if it's recurring, promote it into the relevant rules file.
- **Don't trust "done" until you've used the feature yourself** for 15 minutes.

## What's deliberately excluded

- **Collaboration / multi-user shared annotations** — would require real-time sync (Yjs, Liveblocks) and adds significant complexity. Build solo first, add later.
- **AI features** (auto-summary, auto-tag) — great later. Don't scope-creep v1.
- **Mobile native apps** — web-responsive only in v1.
- **i18n** — English first. Architect for it later.
- **SSO / SAML** — enterprise feature. Later.

Good luck!
