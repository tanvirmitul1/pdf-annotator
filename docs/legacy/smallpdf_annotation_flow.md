# Smallpdf Annotation Flow — Reference Spec for Agentic AI (Antigravity)

> **Source:** Reverse-engineered from [smallpdf.com/edit-pdf#r=annotate](https://smallpdf.com/edit-pdf#r=annotate) and [smallpdf.com/pdf-annotator](https://smallpdf.com/pdf-annotator)  
> **Purpose:** Use this document to align Antigravity's annotation UX and logic with Smallpdf's proven annotation flow.

---

## 1. Entry Point & File Ingestion

### 1.1 Upload Methods
- **Drag & Drop** — user drags a file directly onto the editor canvas/upload zone.
- **File Picker ("Choose Files")** — opens OS file browser.
- **Supported Input Formats:** PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, PNG, JPG.
- Non-PDF files are **auto-converted to PDF** before entering the annotation editor.

### 1.2 Upload State Feedback
- Show a loading/progress indicator with the message: `"Getting your file ready..."`
- Once ready, transition directly into the editor — no intermediate confirmation screen.

### 1.3 Mode Routing
- The URL hash `#r=annotate` signals the app to open directly in **Annotate mode** rather than the default Edit mode.
- Antigravity equivalent: accept a `mode=annotate` parameter or intent flag to route the AI directly into annotation context.

---

## 2. Editor Layout & Toolbar

### 2.1 Top Toolbar — Annotation Tools (Left to Right)
The toolbar is persistent and visible at all times. Tools are grouped by function:

| Group | Tools |
|---|---|
| **Selection** | Pointer / Select tool |
| **Text Markup** | Highlight, Underline, Strikethrough |
| **Freehand** | Pencil / Draw tool (custom color + stroke width) |
| **Shapes** | Rectangle, Circle, Arrow, Line |
| **Text** | Add Text box (click-to-place) |
| **Sticky Notes** | Callout / Comment bubble |
| **Images** | Insert Image |
| **Eraser** | Remove specific annotations |

### 2.2 Tool Properties Panel
When a tool is selected, a **contextual sub-toolbar** appears with:
- **Color picker** — for text, shapes, highlights, pencil strokes
- **Opacity slider** — for highlights and overlays
- **Stroke/line weight** — for pencil and shape borders
- **Font size & style** — for text boxes

### 2.3 Mode Tabs (Top of Editor)
Smallpdf separates editor intent into named tabs:
- `Annotate` — markup, highlights, drawings, shapes, sticky notes
- `Edit Text` *(Pro)* — modify existing PDF text directly
- `Edit Images` — insert, resize, move images
- `Organize` — reorder, merge, extract, split pages

> **Antigravity note:** Map these to distinct AI agent modes or sub-agents. The annotate tab is a lightweight, non-destructive layer; the edit tab requires deeper PDF parsing.

---

## 3. Core Annotation Flow — Step by Step

### Step 1 — Tool Selection
User clicks a tool from the toolbar.  
→ Tool becomes active (highlighted/selected state).  
→ Cursor changes to reflect the active tool (crosshair for shapes, pen for draw, I-beam for text, etc.).

### Step 2 — Annotation Placement
Depending on the tool type, placement works as follows:

**Text Highlight / Underline / Strikethrough:**
1. User clicks and drags over text in the PDF.
2. Selected text region is detected (using PDF text layer if present).
3. Markup is applied as a colored overlay on the selected region.
4. Color defaults to yellow for highlight; can be changed immediately after.

**Freehand / Pencil Draw:**
1. User clicks and holds, then draws on the canvas.
2. Stroke is rendered in real-time as a vector path.
3. On mouse release, the stroke is committed as an annotation object.
4. Stroke is selectable and movable after placement.

**Shape (Rectangle, Circle, Arrow, Line):**
1. User clicks and drags to define the shape's bounds.
2. Shape preview is shown during drag.
3. On release, shape is committed with default border color and no fill (or light fill).
4. Shape can be resized via handles, moved via drag.

**Text Box:**
1. User clicks on the canvas at desired position.
2. A text input cursor appears at that location.
3. User types; text box auto-expands to fit content.
4. Clicking outside the text box commits it as an annotation object.

**Sticky Note / Callout:**
1. User clicks on desired position.
2. A comment bubble/callout box appears with a text input.
3. User types their note.
4. Note is pinned to the clicked position; displays as a small icon when collapsed.

**Insert Image:**
1. User clicks the image tool.
2. OS file picker opens — accepts PNG, JPG.
3. Uploaded image is placed at center of current viewport.
4. User can drag to reposition and use corner handles to resize.

### Step 3 — Annotation Selection & Editing
- Clicking any placed annotation with the **pointer/select tool** selects it.
- Selection shows bounding box with resize handles.
- Right-click or toolbar menu offers: **Delete, Duplicate, Move to front/back, Change color.**
- Double-clicking a text annotation reopens the text editor.

### Step 4 — Annotation Modification
- **Move:** Click + drag the annotation.
- **Resize:** Drag corner/edge handles.
- **Recolor:** Select → change color in the properties sub-toolbar.
- **Delete:** Select → press Delete key, or use toolbar delete button.
- **Undo/Redo:** Standard Ctrl+Z / Ctrl+Y (or Cmd+Z / Cmd+Y on Mac). Unlimited within the session.

### Step 5 — Multi-Page Navigation
- Scrolling the canvas moves between pages vertically.
- Page thumbnails panel (sidebar) allows direct jump to any page.
- Annotations are page-scoped — each annotation belongs to a specific page.
- Annotating across pages is done by navigating and annotating on each page independently.

---

## 4. Form Field Auto-Detection

When a PDF contains **interactive form fields** (AcroForm fields):
- Smallpdf auto-detects these fields on load.
- User can click directly on form fields and begin typing — no need to manually add a text box.
- Detected fields are visually highlighted (light blue border) to indicate they are fillable.
- After typing, the field value is stored as part of the annotation/form data layer.

> **Antigravity note:** Implement form field detection as a pre-processing step on file load. Flag detected fields as `type: formField` with their bounding box coordinates and field name for direct injection.

---

## 5. Collaboration & Sharing Flow

### 5.1 Inline Sharing
- After annotating, user can generate a **shareable link** directly from the editor (no download required).
- Link recipient can view the annotated PDF in-browser.

### 5.2 Download Flow
1. User clicks **"Finish"** or **"Export"** button.
2. Output format selection: PDF (default), or other formats (Word, JPG, etc.) via "Export as".
3. File is processed server-side — annotations are baked/flattened into the PDF.
4. Download begins automatically, or file is saved to connected cloud (Dropbox, Google Drive).

### 5.3 Save to Cloud
- Options: **Smallpdf account storage**, **Dropbox**, **Google Drive**.
- Shown as icons/buttons in the export panel.

---

## 6. Annotation Data Model (Logical)

Each annotation object should carry the following metadata:

```json
{
  "id": "uuid",
  "type": "highlight | underline | strikethrough | freehand | shape | textbox | stickyNote | image",
  "page": 1,
  "position": { "x": 120, "y": 340 },
  "dimensions": { "width": 200, "height": 50 },
  "color": "#FFFF00",
  "opacity": 0.8,
  "content": "User typed text (for textbox/stickyNote)",
  "strokeWidth": 2,
  "createdAt": "ISO timestamp",
  "modifiedAt": "ISO timestamp",
  "author": "user_id or 'anonymous'"
}
```

---

## 7. UX Principles Extracted from Smallpdf

| Principle | Implementation |
|---|---|
| **Zero friction entry** | No login required for basic annotation; no setup or tutorial shown first |
| **Non-destructive by default** | Annotations are a layer on top — original PDF content is never altered until export |
| **Real-time rendering** | All annotation changes appear instantly on the canvas |
| **Tool persistence** | Selected tool stays active until user switches — no "one shot" tools |
| **Contextual properties** | Properties panel only shows options relevant to the active tool |
| **Auto-form detection** | PDF form fields are detected and flagged on load, before the user touches anything |
| **Progressive export** | User can export at any time; export is not locked behind a "done" state |
| **Undo is always available** | Full session history, no save/checkpoint required to undo |
| **Cross-device parity** | Same feature set on desktop, tablet, and mobile browsers |

---

## 8. Antigravity AI Integration Notes

### Agent Trigger Conditions
The AI agent should activate annotation assistance when:
- User says: "annotate", "highlight", "mark up", "add a note", "draw on", "circle", "underline"
- User uploads a PDF and asks for review, feedback, or markup
- User asks to "fill in" or "complete" a form

### Suggested Agent Actions
- `ADD_HIGHLIGHT(page, textRange, color)` — highlight a span of text
- `ADD_TEXTBOX(page, x, y, content, fontSize, color)` — place a text annotation
- `ADD_SHAPE(page, shapeType, x, y, width, height, color)` — draw a shape
- `ADD_STICKY_NOTE(page, x, y, content)` — attach a comment bubble
- `ADD_FREEHAND(page, pathData, color, strokeWidth)` — draw a freehand stroke
- `FILL_FORM_FIELD(page, fieldId, value)` — fill a detected form field
- `DELETE_ANNOTATION(annotationId)` — remove an annotation
- `EXPORT_PDF(flattenAnnotations: true)` — bake annotations and download

### Output Contract
When the agent completes annotation, it should return:
```json
{
  "status": "success",
  "annotationsAdded": 5,
  "pages_affected": [1, 2, 3],
  "exportReady": true,
  "downloadUrl": "..."
}
```

---

## 9. Quick Reference — Annotation Flow Summary

```
[File Upload] 
    ↓
[Auto-convert to PDF if needed]
    ↓
[Load PDF into Editor]
    ↓
[Detect form fields (AcroForm)]
    ↓
[User selects annotation tool from toolbar]
    ↓
[User places annotation on canvas]
    ↓
[Annotation rendered as non-destructive layer]
    ↓
[User selects, edits, moves, recolors, or deletes annotations]
    ↓
[Optional: navigate to next page and repeat]
    ↓
[Click "Finish" / "Export"]
    ↓
[Annotations flattened into PDF]
    ↓
[Download or share via link / cloud storage]
```

---

*Document version: 1.0 — Generated for Antigravity agentic AI annotation module.*
