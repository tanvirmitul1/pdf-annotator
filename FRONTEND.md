# FRONTEND.md

## Tooling

- Tailwind CSS — utility first, no custom CSS unless unavoidable.
- shadcn/ui — primitives live in `/components/ui`, unmodified. Customize via composition in `/components/common`.
- lucide-react — icons only. No other icon library.
- framer-motion — transitions (sparingly, <200ms).
- react-hook-form + Zod — all forms.
- sonner — toasts (wrapped via feature slice).

## Theming: light + dark

- CSS variables approach per shadcn. Defined in `/styles/globals.css`.
- Theme state lives in Redux (`features/theme/slice`) AND is persisted to localStorage AND respects `prefers-color-scheme` on first visit.
- ThemeProvider sets `data-theme` on `<html>`. No flash of wrong theme: use a blocking script in layout to set the attribute before paint.
- Every component must be tested in both themes. Every PR description must state: "verified in light and dark".
- **Never hardcode colors.** Use semantic tokens: `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `bg-destructive`, etc. If you need a new token, add it to globals.css and document in DECISIONS.md.

## Component rules

- Server Components by default. Add `"use client"` only when needed (state, effects, event handlers, browser APIs).
- Keep Client Components small and leaf-ish. Push state down.
- Props interfaces exported. No inline prop types.
- Variants via `class-variance-authority` (cva).
- No barrel files that re-export everything — use explicit imports to keep tree-shaking effective. Feature `index.ts` files re-export only the public API.

## Interaction contract (applies EVERYWHERE)

Every interactive element must provide:

1. Visual hover state (distinct from default)
2. Visual focus-visible state (keyboard)
3. Visual active/pressed state
4. Visual disabled state if disable-able
5. `aria-label` if icon-only
6. Tooltip on hover AND focus if the element is icon-only or if its purpose isn't obvious from its label
7. Cursor: pointer for clickable, text for editable, not-allowed for disabled

For annotations specifically:

- **HOVER:** 150ms delay, show HoverCard with preview, tags, meta
- **CLICK:** open right-side panel with full editor
- **FOCUS:** same treatment as hover for keyboard users
- **Mobile:** tap = open panel (no hover), long-press = context menu

## Interaction Design Contract (canonical table)

This table is the source of truth. Every new interactive element must have a row here. Add rows in a PR; don't invent behavior ad-hoc.

### Document card (dashboard grid)

- **Hover:** border color shifts to `border-primary/40`, subtle shadow lift (shadow-md → shadow-lg, 150ms ease), bottom overlay fades in showing "Last opened 2h ago · 142 pages"
- **Focus-visible:** 2px ring in `ring-primary`, same overlay as hover
- **Click:** navigate to `/app/documents/[id]`
- **Long-press (mobile):** open context menu
- **Keyboard:** Enter or Space = click, ArrowKeys in grid = move focus

### Document card ⋯ button

- **Hover:** background `bg-accent`, tooltip "More actions"
- **Click:** dropdown menu (Rename, Move to collection, Share, Download, Duplicate, Delete)

### Annotation on PDF (highlight/underline/note marker)

- **Hover:** 150ms delay → HoverCard at cursor with:
  - Type icon + color dot
  - Comment preview (first 120 chars, "..." if longer)
  - Tag chips (max 3, "+N" if more)
  - "Created by you · 3 days ago"
  - Annotation itself gets `opacity-80` + `ring-2 ring-current`
- **Focus-visible:** same as hover (keyboard Tab reaches annotations)
- **Click:** opens right panel with full annotation, annotation itself gets persistent selection ring
- **Mobile tap:** opens right panel directly (no hover stage)
- **Double-click:** inline-edit comment (desktop)
- **Right-click:** context menu (Copy text, Change color, Delete)

### Annotation toolbar button (Highlight, Underline, etc.)

- **Hover:** `bg-accent` + tooltip with name + keyboard shortcut (e.g., "Highlight (H)")
- **Focus-visible:** 2px ring
- **Click:** activates tool, button gets `bg-primary text-primary-foreground`
- **Active state persists** until another tool chosen or Esc pressed

### Tag chip

- **Hover (in list):** cursor pointer, background shift, tooltip showing count "5 annotations"
- **Click:** filters current view by this tag
- **Hover (on annotation):** no interaction (decorative there)
- **X button inside chip:** Hover → red tint, Click → remove tag

### Side panel — annotation editor

- **Opens:** slide in from right, 180ms ease-out, backdrop on mobile
- **Comment textarea:** autosize, autosave on blur + every 300ms debounced
- **Tag input:** type → autocomplete from user's tags, Enter creates new, Backspace on empty removes last tag
- **Color picker:** row of circles, hover scales 1.1, click applies immediately (optimistic)
- **Delete button:** two-step (click once → turns red, "Click again to confirm", 3-second revert)
- **Close:** Esc, X button, or click outside on mobile

### Page thumbnail (sidebar)

- **Hover:** scale 1.02, border `border-primary/60`
- **Focus-visible:** 2px ring
- **Click:** scroll to that page
- **Current page marker:** permanent `ring-2 ring-primary`, badge with page number

### Upload drop zone

- **Default:** dashed border, drop icon, "Drop files or click to browse"
- **Hover:** `border-primary`, `bg-primary/5`
- **Drag-over:** `border-primary-solid`, `bg-primary/10`, icon scales 1.1
- **Uploading:** progress bar, file name, cancel button (hover red)
- **Success:** green check, fade out after 1.5s

### Form inputs (generic)

- **Default:** `border-input`
- **Hover:** `border-input/80` (subtle)
- **Focus:** `border-primary` + 2px `ring-primary/20`
- **Error:** `border-destructive` + error text below
- **Disabled:** `opacity-50 cursor-not-allowed`

### Buttons (generic)

Variants from shadcn (default, secondary, outline, ghost, destructive). Every variant must provide hover/focus/active/disabled states at parity.

### Modal

- **Opens:** backdrop fades in (120ms), panel scales 0.96 → 1 (180ms)
- **Esc:** closes
- **Backdrop click:** closes (unless `disableBackdropClose`)
- **Focus:** trapped inside, restored to trigger on close
- **Scrollable content:** scroll inside panel, not backdrop

### Toast

- **Appears:** slide up from bottom-right (desktop), top (mobile)
- **Duration:** 4s default, 7s for errors, persistent for critical
- **Hover:** pauses timer
- **Action button:** optional (e.g., "Undo" on delete)
- **Dismiss:** X button or swipe on mobile

### Command palette (Cmd/Ctrl+K)

- **Opens:** backdrop + centered modal
- **Typing:** fuzzy filter across commands, docs, tags
- **Arrow keys:** navigate results
- **Enter:** execute
- **Esc:** close

## Keyboard shortcuts (register in one place)

**Global:**

- `?` — shortcut help overlay
- `Cmd/Ctrl+K` — command palette
- `g d` — go to dashboard
- `g s` — go to settings
- `g t` — go to trash

**Viewer:**

- `←`/`→` or `PgUp`/`PgDn` — prev/next page
- `Home`/`End` — first/last page
- `+`/`-` — zoom
- `0` — fit width
- `Cmd/Ctrl+F` — search in document
- `B` — toggle bookmark on current page
- `T` — toggle thumbnails sidebar
- `O` — toggle outline sidebar
- `Esc` — close overlays / deselect

**Annotation:**

- `V` — select tool
- `H` — highlight
- `U` — underline
- `S` — strikethrough
- `N` — sticky note
- `P` — freehand pen
- `R` — rectangle
- `C` — circle
- `A` — arrow
- `X` — text box
- `Delete` — delete selected annotation
- `Cmd/Ctrl+Z` / `Cmd/Ctrl+Shift+Z` — undo / redo

Register all shortcuts through `/hooks/useShortcuts` so the help overlay is auto-generated.

## Copy voice

- **Direct, friendly, never cute.** "Upload your first document" not "Let's get started on your journey!"
- **No jargon to users.** Internally "annotation," user-facing "note" or specific type ("highlight").
- **Errors are honest and actionable.** "Upload failed — file is too large (max 50MB)" not "Oops! Something went wrong."
- **Success is understated.** Green check, 1.5s toast. No celebration unless genuinely celebratory (first upload, milestone).
- **Buttons are verbs.** "Save changes," "Delete forever," "Create share link." Never "OK" or "Submit."

## Accessibility (WCAG AA baseline)

- Every image has alt text (or `alt=""` if decorative).
- Every form input has a visible or sr-only label.
- Color contrast verified in both themes.
- Focus order follows DOM order; no `tabindex > 0`.
- Skip-to-content link on every page.
- `aria-live` regions for async feedback (save status, errors).
- Keyboard shortcut overlay available via `?`.
- axe-core runs in CI. Zero violations.

## Forms

- react-hook-form + zodResolver.
- Shared Zod schemas live in `features/<domain>/schema.ts` so the backend uses the same ones.
- Disable submit while pending; show loading state.
- Surface server errors via `setError`.

## Loading, error, empty states

Every page and every data-bound component handles all four:

- **Loading:** skeleton matching final layout (no CLS)
- **Error:** inline error with retry action
- **Empty:** copy + illustration + primary CTA
- **Success:** actual content

## Motion

- Respect `prefers-reduced-motion`. Wrap framer-motion with a hook that returns no-op variants when reduced motion is requested.
- No animation longer than 250ms for interactive feedback.
- No gratuitous motion.

## Performance rules

- No `<img>`; use `next/image`.
- Dynamic import heavy components (`PdfViewer`, `ImageAnnotator`, `CodeMirror` if used) with a skeleton fallback.
- Memoize expensive children with `React.memo`; memoize callbacks with `useCallback` only when they cross a memoized boundary.
- Virtualize any list > 50 items (react-window / TanStack Virtual).
- Avoid re-renders from context — use selectors or split contexts.

## shadcn install discipline

- Add components via `npx shadcn add <name>`. Commit as-is.
- Never modify `/components/ui` files directly. If you need a variant, compose in `/components/common`.
- Track installed components in DECISIONS.md.

## Added interaction rows

### Sidebar navigation item (app shell)

- **Hover:** subtle surface lift, border tint to `border-primary/20`, icon shifts to `text-primary`
- **Focus-visible:** 2px ring in `ring-primary`
- **Click:** navigates immediately to the route
- **Active state:** `bg-primary/10`, stronger text contrast, persistent active icon tint

### Theme toggle button

- **Hover:** `bg-accent`, icon remains legible, tooltip "Theme"
- **Focus-visible:** 2px ring
- **Click:** opens dropdown with Light / Dark / System
- **Active state:** current theme reflected in the trigger icon

### Auth primary button (Google / credentials submit)

- **Hover:** slightly brighter background, no layout shift, icon remains aligned
- **Focus-visible:** 2px ring in `ring-primary`
- **Click:** immediately starts auth flow, pending state swaps in spinner
- **Disabled:** lowered opacity, `cursor-not-allowed`
