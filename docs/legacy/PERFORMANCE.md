# PERFORMANCE.md

## Budgets

- **Initial JS:** < 250 KB gzipped on `/app` routes
- **LCP:** < 2.0s on 4G throttle (mid-tier mobile)
- **TTI:** < 3.0s on same
- **CLS:** < 0.05
- **INP:** < 200ms
- **API p95:** < 200ms reads, < 400ms writes
- **Viewer FPS:** > 55 sustained with 500 annotations, 200-page PDF
- **Viewer memory:** < 500MB after 10 minutes of use

## Measurement

- Lighthouse CI on every PR against `/dashboard` and `/documents/[sample]`.
- Bundle analyzer report committed on any dep change.
- Sentry Performance on prod.
- Weekly review of slowest routes.

## Techniques to reach goals

- RSC for data-heavy pages.
- Dynamic import for PDF viewer, image annotator.
- `next/image` always.
- Virtualize lists > 50 items.
- Memoize only where profiler proves benefit.
- RTK Query cache hits count as free.
- Redis cache for plan + usage reads (60s TTL).
- EXPLAIN ANALYZE on every slow query before shipping.

## PDF-specific performance

- **Windowing:** only render pages in ±2 of viewport (react-window or custom).
- **Text layer:** lazy-generated per-page, cached, disposed when out of window.
- **Annotations:** single SVG per page (not N DOM nodes).
- **Thumbnails:** separate low-res canvas worker; don't share with main render.
- **Search:** pre-extracted text in DB (`DocumentText`), not runtime PDF parsing.

## Red flags to catch in review

- `.map` rendering > 100 items without virtualization
- `useEffect` fetching (should be RTK Query)
- Inline object/function props on memoized components
- Images without width/height
- Fonts not preloaded
- Large deps (check bundle report)
- `useState` storing what should be derived

## Profiling workflow

When a feature feels slow:

1. Record a React Profiler session during the slow interaction.
2. Identify components that rendered > 5 times per frame.
3. Check if they should be memoized or if props are changing reference.
4. Check if state updates can be batched or moved to Zustand.
5. For viewer, use Chrome Performance tab; flame graph should show < 16ms per frame.

## Database performance

- Every query on a table with > 10k rows must use an index.
- Review `pg_stat_statements` monthly.
- N+1 detection: use Prisma's query logging in dev; alert on any query that fires in a loop.

## Targets per phase

Each phase must report actual measurements in the PR description:

- Phase 3 (viewer): FPS test with 200-page PDF documented.
- Phase 4 (annotations): FPS test with 500 annotations documented.
- Phase 10: full Lighthouse and API p95 report.
