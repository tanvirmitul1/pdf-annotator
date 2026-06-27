import { useCallback } from "react"
import { useViewer } from "@/features/viewer/provider"
import { useUpdatePageOrderMutation } from "@/features/viewer/api"
import type { PageMetadata } from "@/features/viewer/store"
import { toast } from "sonner"

export function usePageManager() {
  const documentId = useViewer((s) => s.documentId)
  const [updatePageOrder] = useUpdatePageOrderMutation()

  const persistChange = useCallback(async (newOrder: PageMetadata[]) => {
    try {
      await updatePageOrder({ documentId, pageOrder: newOrder }).unwrap()
    } catch (error) {
      console.error("Failed to persist page order:", error)
      toast.error("Failed to save page changes")
    }
  }, [documentId, updatePageOrder])

  return {
    persistChange
  }
}
