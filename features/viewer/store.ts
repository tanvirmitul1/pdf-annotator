import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

export type SidebarTab = "thumbnails" | "outline" | "bookmarks"

export interface SearchMatch {
  pageNumber: number
  matchIndex: number
  text: string
  startOffset: number
  endOffset: number
}

export interface ViewerState {
  documentId: string
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

  // Actions
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
}

export const createViewerStore = (documentId: string) =>
  create<ViewerState>()(
    subscribeWithSelector((set, get) => ({
      documentId,
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
    }))
  )

export type ViewerStore = ReturnType<typeof createViewerStore>
