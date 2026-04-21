"use client"

import { createContext, useContext, useRef, type ReactNode } from "react"
import { useStore, type StoreApi } from "zustand"

import { createViewerStore, type ViewerStore, type ViewerState } from "./store"

const ViewerContext = createContext<StoreApi<ViewerState> | null>(null)

export interface ViewerProviderProps {
  documentId: string
  children: ReactNode
}

export function ViewerProvider({ documentId, children }: ViewerProviderProps) {
  const storeRef = useRef<ViewerStore | null>(null)
  if (!storeRef.current) {
    storeRef.current = createViewerStore(documentId)
  }
  return (
    <ViewerContext.Provider value={storeRef.current}>
      {children}
    </ViewerContext.Provider>
  )
}

export function useViewer<T>(selector: (s: ViewerState) => T): T {
  const store = useContext(ViewerContext)
  if (!store) throw new Error("useViewer must be used inside ViewerProvider")
  return useStore(store, selector)
}
