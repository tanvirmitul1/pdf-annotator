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
