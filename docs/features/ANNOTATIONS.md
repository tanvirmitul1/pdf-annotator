# ANNOTATIONS.md

The annotation engine is the heart of this product. This file is the contract for how annotations are represented, positioned, rendered, and persisted.

## Annotation type catalog

```ts
type AnnotationType =
  // PDF-only, tied to text layer
  | 'HIGHLIGHT' | 'UNDERLINE' | 'STRIKETHROUGH' | 'SQUIGGLY'
  // PDF or image, positioned
  | 'NOTE'           // sticky note / point annotation
  | 'FREEHAND'       // hand-drawn path
  | 'RECTANGLE' | 'CIRCLE' | 'ARROW'
  | 'TEXTBOX';       // typed text overlay
```

## Position data (JSONB)

Stored in `Annotation.positionData`. Exact TypeScript types per type:

```ts
// Common
interface BaseSpace {
  pageNumber: number;  // 1-indexed; images use 1
  // All coords are in SOURCE SPACE, not screen space:
  // - PDFs: PDF points (72/inch) with origin at top-left
  // - Images: pixels of the original image
}

interface TextAnchor {
  // For highlight/underline/strike/squiggly
  rects: Array<{ x: number; y: number; width: number; height: number }>;
  // The quoted text, for regeneration if text layer is rebuilt
  quotedText: string;
  // Prefix/suffix context for robust re-anchoring
  prefix: string;   // up to 32 chars before
  suffix: string;   // up to 32 chars after
}

interface PointPosition extends BaseSpace {
  x: number;
  y: number;
}

interface RectPosition extends BaseSpace {
  x: number; y: number; width: number; height: number;
  rotation?: number;  // radians
}

interface PathPosition extends BaseSpace {
  // SVG-style path, coordinates in source space
  points: Array<{ x: number; y: number; pressure?: number }>;
  strokeWidth: number;
}

interface ArrowPosition extends BaseSpace {
  from: { x: number; y: number };
  to: { x: number; y: number };
  strokeWidth: number;
}

type PositionData =
  | (BaseSpace & { kind: 'TEXT'; anchor: TextAnchor })
  | (BaseSpace & { kind: 'POINT' } & PointPosition)
  | (BaseSpace & { kind: 'RECT' } & RectPosition)
  | (BaseSpace & { kind: 'PATH' } & PathPosition)
  | (BaseSpace & { kind: 'ARROW' } & ArrowPosition);
```

## Coordinate system rules

- **Source space always.** Never store screen coordinates. Zoom, rotation, and device pixel ratio change; the document doesn't.
- **Page-number based.** Every annotation is bound to one page. If a tool could span pages (e.g., highlight crossing page break), split into two annotations.
- **Rotation independent.** Storage coords assume 0° rotation. The renderer applies rotation at draw time.

## Rendering pipeline

1. RTK Query loads all annotations for the document in one call.
2. Grouped by `pageNumber` in a selector.
3. When a page enters the virtualized viewport, its annotations are rendered as SVG overlays positioned absolutely over the page canvas.
4. Transform: `source coords → screen coords = (coord * zoom)` with rotation matrix applied.
5. Text annotations use the PDF text layer's client rects as the source for `rects[]` at creation time.

## Text re-anchoring

Text layers can be unstable across PDF.js versions. To survive:

- Store `quotedText`, `prefix`, `suffix` at creation.
- On load, if stored `rects` don't align with current text layer (detected by comparing extracted text at those rects to `quotedText`), re-anchor by searching for `prefix + quotedText + suffix` in the page's text content.
- Mark annotations as `orphaned` if re-anchoring fails; show them with a warning icon and a "relocate" affordance.

## Creation flow (highlight example)

1. User has `HIGHLIGHT` tool active.
2. User selects text with mouse/keyboard.
3. On selection end: capture `window.getSelection()`, extract the client rects, convert to PDF source coords using current zoom/rotation.
4. Build `TextAnchor` with quoted text, prefix, suffix.
5. Zustand `startDraft` with the anchor.
6. A small inline toolbar appears near the selection: 4 color swatches, a comment icon, a tag icon, a dismiss (Esc).
7. User picks color → `commitDraft` fires RTK Query `createAnnotation` with optimistic update.
8. Comment and tags can be added immediately in the right panel or later.

## Eraser behavior

- Eraser tool removes only the current user's annotations.
- Hover on an annotation while eraser active → red tint.
- Click → delete with 5s undo toast (soft delete; fully purged on panel close + 30s or page unload).

## Undo / redo

- Per-viewer-session undo stack in Zustand.
- Max 50 entries.
- Each entry records: action (create/update/delete), annotation snapshot before, snapshot after.
- Cleared on document change.
- Does NOT persist across reloads (deliberate; undo infinity is rarely wanted for annotations).

## Conflict handling

Last-write-wins on the server, but reduce conflict surface:

- Annotation updates are PATCH with only changed fields.
- `updatedAt` compared server-side; if client is stale by > 5s, the server responds 409 and client refetches.
- Conflicts are rare in single-user product; more important when sharing/collab features land.

## Performance budget per page render

- ≤ 5ms for up to 50 annotations on a page
- ≤ 16ms for up to 500 annotations on a page
- Annotations rendered as a single SVG per page (not N DOM nodes)
- Hit testing via spatial index if page has > 100 annotations

## Export formats

- **JSON:** full fidelity, round-trippable
- **CSV:** flattened (one row per annotation, with quoted text, comment, tags joined by `;`, page number, created date)
- **Markdown:** grouped by page, highlights as blockquotes, comments as list items — optimized for study notes

## Flattened (burnt-in) PDF export

- Uses `pdf-lib` to draw annotations into the PDF itself.
- **Supported:** highlight, underline, strikethrough, shapes, text box.
- **Partial support:** freehand (approximated as polyline), sticky note (rendered as small icon with comment in a PDF annotation).
- Background job; emailed when ready.
- Always exports a copy; original is never modified.

## Autosave rules

- Every annotation change: optimistic UI update via RTK Query, debounced save (300ms).
- Save-on-blur for panel edits.
- Flush pending saves on page unload (use `navigator.sendBeacon`).
- Surface save status in a small indicator in the viewer header: "Saved", "Saving…", "Offline — will retry".

## Authorization

- Every annotation endpoint checks userId ownership AND that the parent document is owned by userId.
- Quotas: `assertCanPerform(userId, "annotation.create", { documentId })` checks `maxAnnotationsPerDoc`.
