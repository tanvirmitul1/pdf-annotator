# UI/UX Overhaul Plan

## Current State Assessment

After reading every page and component, the UI is actually **already well-structured** with:
- Glass-panel design system, oklch color palette, light/dark mode
- AuthShell, LogoMark, ThemeToggle, ProtectedShell with sidebar
- Responsive layouts, radial gradient backgrounds
- Auth redirect logic already in middleware (logged-in users → /app)

**What needs improvement:**
- Placeholder pages (Collections, Tags, Trash, Help, Settings) have no real content — just marketing copy
- Document list is a flat, unstyled list with no visual hierarchy
- Upload zone needs more polish
- No micro-animations or transitions between states
- Document cards lack visual richness (no hover effects, no smooth state transitions)
- Placeholder pages need actual empty states with actions

## Plan

### Phase A: Document List & Cards (highest impact)

**File: `components/documents/list.tsx`**

1. Redesign document cards with:
   - Larger thumbnail preview (aspect ratio preserved)
   - Smooth hover: slight scale + shadow lift + border glow
   - Processing state: animated shimmer on thumbnail area + progress bar
   - Failed state: red accent border + retry button (already done)
   - Ready state: clickable with smooth transition
   - Staggered fade-in animation on load
   - Grid layout option (2-3 cols on desktop) alongside list view

2. Add view toggle (grid/list) with smooth transition

3. Better empty state with illustration-like icon composition

### Phase B: Upload Zone Polish

**File: `components/documents/upload.tsx`**

1. Add animated dashed border on hover (CSS animation)
2. Smooth drag-enter transition with scale + glow
3. Upload progress: circular progress indicator instead of flat bar
4. Success state: checkmark animation before resetting

### Phase C: Dashboard Page

**File: `app/app/(main)/page.tsx`**

1. Welcome greeting with user name + time of day
2. Quick stats row (total docs, processing, storage used)
3. Recent activity section

### Phase D: Placeholder Pages → Real Empty States

**Files: collections, tags, trash, help, settings pages**

Replace marketing copy with actionable empty states:
- Collections: "Create your first collection" + button
- Tags: "Tags will appear here as you annotate" + illustration
- Trash: Show actual deleted docs (DocumentList with showDeleted=true) — already exists but not wired
- Help: Keyboard shortcuts grid + FAQ
- Settings: Profile card, theme toggle, plan info, danger zone

### Phase E: Micro-animations & Transitions

**File: `app/globals.css`**

1. Add transition utilities for card hover effects
2. Stagger animation for list items
3. Page transition fade-in (already partially done with animate-in)

## Files to Create/Modify

**Modify:**
- `components/documents/list.tsx` — card redesign, grid view, animations
- `components/documents/upload.tsx` — drag/drop polish
- `app/app/(main)/page.tsx` — dashboard with greeting + stats
- `app/app/(main)/settings/page.tsx` — real settings UI
- `app/app/(main)/collections/page.tsx` — empty state + create button
- `app/app/(main)/tags/page.tsx` — empty state
- `app/app/(main)/trash/page.tsx` — wire up DocumentList
- `app/app/(main)/help/page.tsx` — shortcuts + FAQ
- `app/globals.css` — animation utilities

**No new dependencies needed** — all animations use CSS/Tailwind.

## Rules that apply
- CLAUDE.md (non-negotiables)
- FRONTEND.md (interaction contract, hover/click affordances)
- Light + dark mode for everything
- Keyboard accessible
- Mobile responsive
