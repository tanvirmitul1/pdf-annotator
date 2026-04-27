import { Separator } from "@/components/ui/separator"

const shortcuts = [
  { keys: ["?"], description: "Open keyboard shortcuts" },
  { keys: ["H"], description: "Highlight tool" },
  { keys: ["U"], description: "Underline tool" },
  { keys: ["S"], description: "Strikethrough tool" },
  { keys: ["N"], description: "Note tool" },
  { keys: ["F"], description: "Freehand draw" },
  { keys: ["Esc"], description: "Deselect / close panel" },
  { keys: ["←", "→"], description: "Previous / next page" },
  { keys: ["Ctrl", "+"], description: "Zoom in" },
  { keys: ["Ctrl", "−"], description: "Zoom out" },
  { keys: ["Ctrl", "0"], description: "Reset zoom" },
  { keys: ["Ctrl", "F"], description: "Search in document" },
  { keys: ["Ctrl", "B"], description: "Toggle bookmarks panel" },
  { keys: ["Delete"], description: "Delete selected annotation" },
]

const faqs = [
  {
    q: "What file types are supported?",
    a: "PDF, PNG, JPG, JPEG, GIF, and WebP files up to 50 MB.",
  },
  {
    q: "Are my documents private?",
    a: "Yes. Documents are only accessible to you unless you explicitly share them via a share link.",
  },
  {
    q: "How do I share a document?",
    a: "Open the document viewer, click the share icon in the toolbar, and copy the generated link.",
  },
  {
    q: "Can I restore a deleted document?",
    a: "Yes. Go to Trash in the sidebar and click the restore icon next to the document.",
  },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center rounded-md border border-border/70 bg-muted px-2 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
      {children}
    </kbd>
  )
}

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
          Help
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Keyboard shortcuts, tips, and frequently asked questions.
        </p>
      </div>

      {/* Shortcuts */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          Keyboard Shortcuts
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {shortcuts.map(({ keys, description }) => (
            <div
              key={description}
              className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-card/60 px-4 py-2.5"
            >
              <span className="text-sm text-foreground">{description}</span>
              <div className="flex shrink-0 items-center gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="glass-panel surface-border rounded-xl p-6 space-y-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
          FAQ
        </p>
        <div className="space-y-4">
          {faqs.map(({ q, a }, i) => (
            <div key={q}>
              {i > 0 && <Separator className="mb-4 opacity-50" />}
              <p className="text-sm font-medium text-foreground">{q}</p>
              <p className="mt-1 text-sm text-muted-foreground leading-6">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
