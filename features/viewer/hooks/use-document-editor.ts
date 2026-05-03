import { create } from "zustand"
import { type PdfObject } from "@/lib/pdf/analyzer"

interface DocumentEditorState {
  isEditMode: boolean
  selectedObjectId: string | null
  hoveredObjectId: string | null
  
  // Actions
  setEditMode: (enabled: boolean) => void
  setSelectedObject: (id: string | null) => void
  setHoveredObject: (id: string | null) => void
}

export const useDocumentEditor = create<DocumentEditorState>((set) => ({
  isEditMode: false,
  selectedObjectId: null,
  hoveredObjectId: null,

  setEditMode: (isEditMode) => set({ isEditMode, selectedObjectId: null }),
  setSelectedObject: (selectedObjectId) => set({ selectedObjectId }),
  setHoveredObject: (hoveredObjectId) => set({ hoveredObjectId }),
}))

/**
 * Enterprise-grade hook for managing PDF object interactions.
 * Separates UI state from business logic for scalability.
 */
export function useObjectInteraction() {
  const { isEditMode, setSelectedObject, selectedObjectId } = useDocumentEditor()
  
  const handleObjectClick = (obj: PdfObject) => {
    if (!isEditMode) return
    setSelectedObject(obj.id)
  }

  return {
    isEditMode,
    selectedObjectId,
    handleObjectClick,
  }
}
