import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

function read(path: string) {
  return readFileSync(path, "utf8")
}

describe("annotation accessibility contract", () => {
  it("toolbar exposes role, labels, and focus-visible affordances", () => {
    const source = read(
      "D:/projects/pdf-annotator/components/annotations/annotation-toolbar.tsx"
    )

    expect(source).toContain('role="toolbar"')
    expect(source).toContain('aria-label="Annotation tools"')
    expect(source).toContain("aria-label={`${tool.label} (${tool.shortcut})`}")
    expect(source).toContain("focus-visible:ring-2")
  })

  it("color picker uses radio semantics", () => {
    const source = read(
      "D:/projects/pdf-annotator/components/annotations/color-picker.tsx"
    )

    expect(source).toContain('role="radiogroup"')
    expect(source).toContain('role="radio"')
    expect(source).toContain("aria-checked={value === c.hex}")
  })

  it("overlay annotations are keyboard reachable and labelled", () => {
    const source = read(
      "D:/projects/pdf-annotator/components/annotations/annotation-overlay.tsx"
    )

    expect(source).toContain('role: "button"')
    expect(source).toContain("tabIndex: 0")
    expect(source).toContain('"aria-label": `${annotation.type.toLowerCase()} annotation')
    expect(source).toContain('if (event.key === "Enter" || event.key === " ")')
  })

  it("panel exposes dialog semantics", () => {
    const source = read(
      "D:/projects/pdf-annotator/components/annotations/annotation-panel.tsx"
    )

    expect(source).toContain('role="dialog"')
    expect(source).toContain('aria-label="Annotation editor"')
  })
})
