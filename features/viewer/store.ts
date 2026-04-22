import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type {
  ToolId,
  AnnotationDraft,
  UndoEntry,
  SaveStatus,
} from "@/features/annotations/types"
import { MAX_UNDO_STACK, DEFAULT_ANNOTATION_COLOR } from "@/features/annotations/types"

export type SidebarTab = "thumbnails" | "outline" | "bookmarks" | "annotations"

export interface SearchMatch {
  pageNumber: number
  matchIndex: number
  text: string
  startOffset: number
  endOffset: number
}

export interface ViewerState {
  documentId: string

  // ─── Viewer state ────────────────────────────────────────────────────────
  zoom: number
  currentPage: number
  totalPages: number
  rotation: 0 | 90 | 180 | 270
  sidebarTab: SidebarTab | null
  sidebarOpen: boolean
  searchQuery: string
  searchMatches: SearchMatch[]
  currentMatchIndex: number
  searchOpen: boolean
  shortcutsOpen: boolean

  // ─── Annotation state ────────────────────────────────────────────────────
  /** The currently active annotation tool */
  activeTool: ToolId
  /** ID of the annotation currently open in the right panel */
  rightPanelAnnotationId: string | null
  /** ID of the orphaned text annotation currently being relocated */
  relocatingAnnotationId: string | null
  /** ID of the annotation currently hovered */
  hoveredAnnotationId: string | null
  /** Annotations whose text anchor could not be re-resolved against the current text layer */
  orphanedAnnotationIds: Record<string, boolean>
  /** In-progress annotation draft */
  draft: AnnotationDraft | null
  /** Current stroke color for the active tool */
  selectedColor: string
  /** Per-tool remembered color */
  toolColors: Partial<Record<ToolId, string>>
  /** Stroke thickness for shape/freehand tools */
  toolThickness: number
  /** Undo history stack */
  undoStack: UndoEntry[]
  /** Redo history stack */
  redoStack: UndoEntry[]
  /** Autosave status indicator */
  saveStatus: SaveStatus

  // ─── Viewer actions ───────────────────────────────────────────────────────
  setZoom: (z: number) => void
  setPage: (p: number) => void
  setTotalPages: (n: number) => void
  setRotation: (r: 0 | 90 | 180 | 270) => void
  setSidebarTab: (tab: SidebarTab) => void
  toggleSidebar: () => void
  openSidebar: (tab: SidebarTab) => void
  closeSidebar: () => void
  setSearchQuery: (q: string) => void
  setSearchMatches: (matches: SearchMatch[]) => void
  setCurrentMatchIndex: (i: number) => void
  nextMatch: () => void
  prevMatch: () => void
  openSearch: () => void
  closeSearch: () => void
  openShortcuts: () => void
  closeShortcuts: () => void

  // ─── Annotation actions ───────────────────────────────────────────────────
  setTool: (t: ToolId) => void
  openAnnotation: (id: string) => void
  closeAnnotation: () => void
  startRelocatingAnnotation: (id: string) => void
  cancelRelocatingAnnotation: () => void
  setHoveredAnnotation: (id: string | null) => void
  setAnnotationOrphaned: (id: string, orphaned: boolean) => void
  startDraft: (d: AnnotationDraft) => void
  updateDraft: (patch: Partial<AnnotationDraft>) => void
  discardDraft: () => void
  setSelectedColor: (color: string) => void
  setToolThickness: (t: number) => void
  pushUndo: (entry: UndoEntry) => void
  undo: () => UndoEntry | null
  redo: () => UndoEntry | null
  clearUndoHistory: () => void
  setSaveStatus: (s: SaveStatus) => void
}

export const createViewerStore = (documentId: string) =>
  create<ViewerState>()(
    subscribeWithSelector((set, get) => ({
      documentId,

      // ─── Viewer defaults ──────────────────────────────────────────────────
      zoom: 1,
      currentPage: 1,
      totalPages: 0,
      rotation: 0 as const,
      sidebarTab: "thumbnails" as SidebarTab,
      sidebarOpen: true,
      searchQuery: "",
      searchMatches: [],
      currentMatchIndex: 0,
      searchOpen: false,
      shortcutsOpen: false,

      // ─── Annotation defaults ──────────────────────────────────────────────
      activeTool: "select" as ToolId,
      rightPanelAnnotationId: null,
      relocatingAnnotationId: null,
      hoveredAnnotationId: null,
      orphanedAnnotationIds: {},
      draft: null,
      selectedColor: DEFAULT_ANNOTATION_COLOR,
      toolColors: {},
      toolThickness: 2,
      undoStack: [],
      redoStack: [],
      saveStatus: "idle" as SaveStatus,

      // ─── Viewer actions ───────────────────────────────────────────────────
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(4, zoom)) }),
      setPage: (currentPage) =>
        set((s) => ({
          currentPage: Math.max(1, Math.min(s.totalPages || 1, currentPage)),
        })),
      setTotalPages: (totalPages) => set({ totalPages }),
      setRotation: (rotation) => set({ rotation }),
      setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      openSidebar: (tab) => set({ sidebarOpen: true, sidebarTab: tab }),
      closeSidebar: () => set({ sidebarOpen: false }),
      setSearchQuery: (searchQuery) => set({ searchQuery, currentMatchIndex: 0 }),
      setSearchMatches: (searchMatches) =>
        set({ searchMatches, currentMatchIndex: 0 }),
      setCurrentMatchIndex: (currentMatchIndex) => set({ currentMatchIndex }),
      nextMatch: () => {
        const { searchMatches, currentMatchIndex } = get()
        if (searchMatches.length === 0) return
        set({ currentMatchIndex: (currentMatchIndex + 1) % searchMatches.length })
      },
      prevMatch: () => {
        const { searchMatches, currentMatchIndex } = get()
        if (searchMatches.length === 0) return
        set({
          currentMatchIndex:
            (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length,
        })
      },
      openSearch: () => set({ searchOpen: true }),
      closeSearch: () =>
        set({ searchOpen: false, searchQuery: "", searchMatches: [] }),
      openShortcuts: () => set({ shortcutsOpen: true }),
      closeShortcuts: () => set({ shortcutsOpen: false }),

      // ─── Annotation actions ───────────────────────────────────────────────
      setTool: (activeTool) => {
        const { toolColors, selectedColor } = get()
        set({
          activeTool,
          draft: null,
          // restore per-tool remembered color
          selectedColor: toolColors[activeTool] ?? selectedColor,
        })
      },
      openAnnotation: (id) => set({ rightPanelAnnotationId: id }),
      closeAnnotation: () => set({ rightPanelAnnotationId: null }),
      startRelocatingAnnotation: (id) => set({ relocatingAnnotationId: id }),
      cancelRelocatingAnnotation: () => set({ relocatingAnnotationId: null }),
      setHoveredAnnotation: (id) => set({ hoveredAnnotationId: id }),
      setAnnotationOrphaned: (id, orphaned) =>
        set((state) => {
          if (orphaned) {
            return {
              orphanedAnnotationIds: {
                ...state.orphanedAnnotationIds,
                [id]: true,
              },
            }
          }

          if (!(id in state.orphanedAnnotationIds)) {
            return state
          }

          const next = { ...state.orphanedAnnotationIds }
          delete next[id]
          return { orphanedAnnotationIds: next }
        }),
      startDraft: (draft) => set({ draft }),
      updateDraft: (patch) => {
        const { draft } = get()
        if (!draft) return
        set({ draft: { ...draft, ...patch } })
      },
      discardDraft: () => set({ draft: null }),
      setSelectedColor: (color) => {
        const { activeTool } = get()
        set({
          selectedColor: color,
          toolColors: { ...get().toolColors, [activeTool]: color },
        })
      },
      setToolThickness: (toolThickness) => set({ toolThickness }),
      pushUndo: (entry) =>
        set((s) => {
          const stack = [entry, ...s.undoStack].slice(0, MAX_UNDO_STACK)
          return { undoStack: stack, redoStack: [] }
        }),
      undo: () => {
        const { undoStack, redoStack } = get()
        if (undoStack.length === 0) return null
        const [entry, ...rest] = undoStack
        set({ undoStack: rest, redoStack: [entry, ...redoStack] })
        return entry
      },
      redo: () => {
        const { undoStack, redoStack } = get()
        if (redoStack.length === 0) return null
        const [entry, ...rest] = redoStack
        set({ redoStack: rest, undoStack: [entry, ...undoStack] })
        return entry
      },
      clearUndoHistory: () =>
        set({
          undoStack: [],
          redoStack: [],
          orphanedAnnotationIds: {},
          relocatingAnnotationId: null,
        }),
      setSaveStatus: (saveStatus) => set({ saveStatus }),
    }))
  )

export type ViewerStore = ReturnType<typeof createViewerStore>
