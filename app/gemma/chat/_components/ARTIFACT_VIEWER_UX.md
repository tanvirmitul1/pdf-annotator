# Enhanced Artifact Viewer - UI/UX Documentation

## Overview

The artifact viewer has been redesigned with professional-grade UI/UX features inspired by modern development tools like VS Code and CodePen.

## Key Features

### 1. **Syntax Highlighting with Prism.js**
- **Multi-colored code display** matching VS Code's Tomorrow Night theme
- Supports 15+ languages: TypeScript, JavaScript, Python, Java, Go, Rust, SQL, HTML, CSS, etc.
- Automatic language detection from artifact type
- Beautiful dark theme optimized for readability

### 2. **Live Preview for Frontend Code**
- **Code View** ↔ **Preview** toggle for HTML/CSS/SVG
- Sandboxed iframe for safe preview rendering
- Real-time rendering of HTML with embedded styles
- Responsive design preview in isolated environment
- Error handling with user-friendly alerts

### 3. **View Mode Toggle**
When viewing HTML, CSS, or SVG files:
- **Code View** (default): See syntax-highlighted source code
- **Preview**: See the rendered output in a live preview pane
- Seamless switching with visual indicators
- Persistent view preference during session

### 4. **Professional Visual Design**
- **Gradient branding** on icons and buttons
- **Color-coded type badges**: HTML (orange), CSS (purple), JSON (yellow), etc.
- **Smooth animations** on hover and interactions
- **Glassmorphism effects** for modern aesthetic
- **Responsive layout** adapts to panel size

### 5. **Enhanced Controls**
- **Copy button** with visual feedback (checkmark on success)
- **Download button** with loading states
- **View toggle** with icon indicators (Code2 / Eye)
- **Tooltips** on all interactive elements
- **Keyboard shortcuts** support (coming soon)

## Supported Preview Types

Files that support live preview (code + preview toggle):
- HTML files (`.html`, `type="html"`)
- CSS files (`.css`, `type="css"`) - rendered in context
- SVG files (`.svg`, `type="svg"`)

All other files show syntax-highlighted code only.

## Component Architecture

```
artifact-viewer.tsx          # Main viewer orchestration
├── code-highlight.tsx       # Prism.js syntax highlighting
├── html-preview.tsx         # Live iframe preview
└── artifact-panel.tsx       # Parent container
```

### Data Flow

```
Artifact
  ↓
ArtifactViewer (determines previewability)
  ↓
  ├─→ Code View → CodeHighlight (Prism.js)
  └─→ Preview → HtmlPreview (iframe sandbox)
```

## User Experience Flow

### Viewing Code
1. Artifact opens in **Code View** by default
2. Syntax highlighting applied automatically
3. User can copy or download immediately

### Viewing HTML/CSS
1. Artifact opens in **Code View**
2. User sees **Code/Preview toggle** in header
3. Click **Eye icon** to switch to Preview
4. HTML renders in sandboxed iframe
5. Click **Code icon** to return to source

### Visual Feedback
- **Hover states**: All buttons have subtle hover effects
- **Active states**: Selected view mode is highlighted
- **Copy feedback**: Checkmark appears on successful copy
- **Loading states**: Spinner during download generation
- **Error states**: Alert banner for preview errors

## Best Practices for Frontend Engineering

### Performance
- Lazy-load Prism.js language components
- Memoize preview content generation
- Debounce view mode switches

### Security
- HTML preview uses `sandbox="allow-scripts"` attribute
- No `allow-same-origin` to prevent parent window access
- CSS is extracted and sanitized before rendering

### Accessibility
- ARIA labels on all icon-only buttons
- Keyboard navigation support
- Focus management on view mode change
- Screen reader announcements for state changes

### Responsive Design
- Fluid typography scales with viewport
- Touch-friendly button sizes (minimum 44x44px)
- Collapsible header on small screens
- Horizontal scroll for wide code blocks

## Future Enhancements

### Phase 2
- [ ] Split view (code + preview side-by-side)
- [ ] Full-screen preview mode
- [ ] Device frame previews (mobile/tablet/desktop)
- [ ] CSS hot-reload for live editing
- [ ] Export to CodePen/JSFiddle

### Phase 3
- [ ] React/Vue component preview with JSX support
- [ ] Markdown live preview with GitHub flavoring
- [ ] JSON tree viewer with collapsible nodes
- [ ] CSV data grid with sorting/filtering
- [ ] SQL query results visualization

### Phase 4
- [ ] Collaborative editing mode
- [ ] Version history with diff view
- [ ] AI-powered code suggestions
- [ ] Accessibility audit for HTML previews
- [ ] Performance profiling for JavaScript

## Color Palette

### Type Badges
```typescript
pdf: red (#ef4444)
html: orange (#f97316)
css: purple (#a855f7)
json: yellow (#eab308)
csv: green (#22c55e)
typescript: blue (#3b82f6)
python: emerald (#10b981)
```

### UI Elements
```css
Gradient: linear-gradient(135deg, var(--primary), var(--accent))
Background: #1d1f21 (code editor)
Border: rgba(255,255,255,0.1)
Shadow: 0 4px 6px rgba(0,0,0,0.1)
```

## Technical Stack

- **Syntax Highlighting**: Prism.js with Tomorrow Night theme
- **Preview Rendering**: Native HTML5 iframe with sandbox
- **Icons**: Lucide React (consistent with app design)
- **Animations**: Tailwind CSS transitions
- **Type Safety**: Full TypeScript coverage

## Usage Example

```typescript
<ArtifactViewer
  artifact={{
    identifier: "landing-page",
    title: "index.html",
    type: "html",
    content: "<html>...</html>"
  }}
  copiedId={copiedId}
  onCopy={(text, id) => copyToClipboard(text, id)}
/>
```

The viewer automatically:
1. Detects it's an HTML file
2. Shows the code/preview toggle
3. Applies syntax highlighting
4. Enables live preview mode
5. Sandboxes the preview safely

## Developer Notes

### Adding New Preview Types
To support a new file type (e.g., Markdown):

1. Add to `PREVIEWABLE_TYPES` in `artifact-viewer.tsx`:
```typescript
const PREVIEWABLE_TYPES = ["html", "css", "svg", "markdown"];
```

2. Create preview component (e.g., `markdown-preview.tsx`):
```typescript
export function MarkdownPreview({ markdown }: { markdown: string }) {
  // Render logic
}
```

3. Add conditional in `artifact-viewer.tsx`:
```typescript
{viewMode === "preview" && (
  artifact.type === "markdown" ? (
    <MarkdownPreview markdown={artifact.content} />
  ) : (
    <HtmlPreview html={artifact.content} />
  )
)}
```

### Customizing Syntax Theme
Replace Prism theme in `code-highlight.tsx`:
```typescript
import "prismjs/themes/prism-okaidia.css"; // or any other theme
```

## Conclusion

This enhanced viewer transforms the artifact experience from a simple code display into a professional development tool. Users can now:
- **See beautiful, readable code** with VS Code-quality highlighting
- **Preview frontend code live** without leaving the chat
- **Switch views seamlessly** for maximum productivity
- **Enjoy modern UI/UX** with smooth animations and clear visual hierarchy

The architecture is scalable, allowing easy addition of new preview modes, file types, and interactive features as the product evolves.
