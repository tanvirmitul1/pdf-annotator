import { describe, expect, it } from "vitest"

import { createViewerStore } from "@/features/viewer/store"

const annotationSnapshot = {
  id: "annotation-1",
  userId: "user-1",
  documentId: "doc-1",
  pageNumber: 1,
  type: "HIGHLIGHT" as const,
  status: "OPEN" as const,
  color: "#fbbf24",
  positionData: {
    kind: "TEXT" as const,
    pageNumber: 1,
    anchor: {
      rects: [{ x: 1, y: 2, width: 3, height: 4 }],
      quotedText: "Hello",
      prefix: "",
      suffix: "",
    },
  },
  content: null,
  deletedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
}

describe("createViewerStore", () => {
  it("supports undo and redo for viewer-session history", () => {
    const store = createViewerStore("doc-1")

    store.getState().pushUndo({
      action: "create",
      before: null,
      after: annotationSnapshot,
    })

    const undone = store.getState().undo()
    expect(undone?.action).toBe("create")
    expect(store.getState().undoStack).toHaveLength(0)
    expect(store.getState().redoStack).toHaveLength(1)

    const redone = store.getState().redo()
    expect(redone?.after?.id).toBe("annotation-1")
    expect(store.getState().undoStack).toHaveLength(1)
    expect(store.getState().redoStack).toHaveLength(0)
  })

  it("clears orphaned state when the session history is reset", () => {
    const store = createViewerStore("doc-1")

    store.getState().setAnnotationOrphaned("annotation-1", true)
    store.getState().startRelocatingAnnotation("annotation-1")
    expect(store.getState().orphanedAnnotationIds["annotation-1"]).toBe(true)
    expect(store.getState().relocatingAnnotationId).toBe("annotation-1")

    store.getState().clearUndoHistory()
    expect(store.getState().orphanedAnnotationIds).toEqual({})
    expect(store.getState().relocatingAnnotationId).toBeNull()
  })
})
