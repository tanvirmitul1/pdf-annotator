"use client"

import { useViewer } from "@/features/viewer/provider"
import { getRegisteredShortcuts } from "@/hooks/use-shortcuts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ShortcutsOverlay() {
  const shortcutsOpen = useViewer((s) => s.shortcutsOpen)
  const closeShortcuts = useViewer((s) => s.closeShortcuts)

  const shortcuts = getRegisteredShortcuts()

  // Group by category
  const grouped = shortcuts.reduce<Record<string, typeof shortcuts>>(
    (acc, s) => {
      ;(acc[s.category] ??= []).push(s)
      return acc
    },
    {}
  )

  return (
    <Dialog open={shortcutsOpen} onOpenChange={(o) => !o && closeShortcuts()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {category}
              </h3>
              <ul className="space-y-1">
                {items.map((s) => (
                  <li
                    key={s.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-foreground">{s.description}</span>
                    <kbd className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
                      {s.label}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {shortcuts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No shortcuts registered.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
