# DECISIONS.md

Append-only log. Don't edit old entries; add new ones that supersede.

## Template

```
### YYYY-MM-DD — short title
**Context:** what problem
**Decision:** what we chose
**Alternatives considered:** with a line each on why not
**Consequences:** trade-offs accepted
```

---

### 2026-04-20 — State management split

**Context:** need scalable state model for a data-heavy SaaS with a high-frequency viewer.

**Decision:** RTK Query for server state, Redux Toolkit slices for global client state, Zustand for ephemeral viewer state.

**Alternatives:** pure Redux (too heavy for viewer), Zustand-only (weaker ecosystem for server cache), React Query + Zustand (fine but we chose RTK for its tight integration and codegen).

**Consequences:** three state libs to learn; clear ownership rules in STATE.md mitigate confusion.

---

### 2026-04-20 — shadcn over headlessui/MUI

**Context:** need accessible primitives with full design control.

**Decision:** shadcn/ui on Radix.

**Alternatives:** Headless UI (weaker component coverage), MUI (hard to restyle), Mantine (opinionated tokens).

**Consequences:** we own the component code; upgrades are manual.

---

### 2026-04-20 — Plans table from day one

**Context:** subscriptions planned for future, but product launches on free tier only.

**Decision:** Plans, Usage, and entitlement checks exist from day one even though every user gets the free plan. Stripe integration is deferred to a dedicated phase.

**Alternatives:** retrofit plans when billing ships (painful migration of live data).

**Consequences:** some unused code paths early; dramatically easier to enable paid tiers later.

---

### 2026-04-20 — Soft delete with 30-day grace

**Context:** accidental deletes are the #1 support ticket in similar products.

**Decision:** Document and Annotation use soft delete (`deletedAt` column). Hard purge is a cron job after 30 days.

**Alternatives:** hard delete + daily backups (restore is painful), soft delete forever (privacy issue, storage bloat).

**Consequences:** queries must always filter `deletedAt: null`; cron job must be reliable.

---

## Add new decisions below

<!-- New entries: append here, never rewrite above -->

### 2026-04-20 — Phase 3: zustand for viewer ephemeral state

**Context:** STATE.md specifies Zustand for ephemeral per-viewer state (zoom, page, search, sidebar). It was not yet installed.

**Decision:** Add zustand — required by the architecture doc as the ephemeral state layer.

**Alternatives considered:** none; explicitly required by STATE.md.

**Consequences:** fourth state lib entry-point; all viewer-local state uses the ViewerProvider pattern so it's isolated and GC-able.

---

### 2026-04-20 — Phase 3: pdfjs-dist directly over react-pdf

**Context:** Phase 3 requires a virtualized PDF viewer. react-pdf is a popular React wrapper around pdfjs-dist.

**Decision:** Use pdfjs-dist directly (already installed). react-pdf would add a new dependency without meaningfully reducing code; direct usage gives us full control over canvas rendering, viewport computation, and task cancellation.

**Alternatives considered:** react-pdf — adds ~50KB for a thin wrapper we'd fight against to get page-by-page control; react-pdf/pdfjs version coupling causes build issues with Next.js 15 App Router.

**Consequences:** we manage the render/cancel lifecycle ourselves; this is ~50 lines of boilerplate in PdfCanvas.

---

### 2026-04-20 — Phase 3: @tanstack/react-virtual for page virtualization

**Context:** A 200-page PDF with variable-height pages needs virtualization. react-window lacks first-class variable-size support without measurement hacks.

**Decision:** @tanstack/react-virtual v3 — native variable-size support, zero dependencies, tree-shakeable.

**Alternatives considered:** react-window — stable but requires VariableSizeList with manual height tracking; no built-in gap support.

**Consequences:** new dependency (~8KB gzipped); virtualizer's dynamic measurement handles mixed-page PDFs correctly.

---

### 2026-04-20 — Phase 3: framer-motion for viewer transitions

**Context:** FRONTEND.md names framer-motion as the animation library. Phase 3 needs slide-in search bar.

**Decision:** framer-motion — required by the design system spec in FRONTEND.md.

**Alternatives considered:** CSS-only transitions — no runtime overhead but can't achieve the motion spec reliably in all browsers for complex enter/exit states.

**Consequences:** ~30KB gzipped; use sparingly (search bar slide, panel transitions only).

---

### 2026-04-20 — Phase 3: (viewer) route group for full-screen layout

**Context:** The existing (main) route group wraps every page in ProtectedShell which constrains max-width to max-w-6xl. A PDF viewer needs the full viewport.

**Decision:** Add an app/(viewer) route group with its own layout that provides auth (requireAppUser) but renders children full-screen without the constrained max-width shell.

**Alternatives considered:** Negative margins to break out of (main) shell — fragile and produces horizontal scroll; separate /view subdomain — scope creep.

**Consequences:** two authenticated route groups; both call requireAppUser so auth is equally enforced.

### 2026-04-20 â€” Trust-layer dependencies for settings and email

**Context:** Phase 1.5 needs forms, validation, transactional email rendering, consent-aware analytics plumbing, and a real test harness before document features exist.

**Decision:** add `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `resend`, `@react-email/components`, `@react-email/render`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `axe-core`, `vitest-axe`, and `jsdom`.

**Alternatives:** hand-rolled validation and form state (too brittle), raw HTML email strings (harder to maintain), delaying tests until later phases (undercuts the trust/account layer).

**Consequences:** larger dependency surface area now, but better validation, email ergonomics, and verification coverage.

---

### 2026-04-20 â€” shadcn primitives added for the settings shell

**Context:** the settings surface needs tabs, menus, avatar handling, cards, badges, and tooltips that match the frontend interaction contract.

**Decision:** install shadcn primitives for `tabs`, `input`, `label`, `tooltip`, `dropdown-menu`, `avatar`, `card`, `badge`, and `separator`.

**Alternatives:** custom-building every primitive (more maintenance), or editing `/components/ui` manually (breaks the repo rule).

**Consequences:** UI composition stays consistent with the design system and `/components/ui` remains generator-managed.
