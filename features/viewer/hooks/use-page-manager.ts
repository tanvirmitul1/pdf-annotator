import { useCallback } from "react"
import { useViewer } from "@/features/viewer/provider"
import { useUpdatePageOrderMutation } from "@/features/viewer/api"
import { toast } from "sonner"

export function usePageManager() {
  const documentId = useViewer((s) => s.documentId)
  const pageOrder = useViewer((s) => s.pageOrder)
  const [updatePageOrder] = useUpdatePageOrderMutation()

  const rotatePage = useViewer((s) => s.rotatePage)
  const deletePage = useViewer((s) => s.deletePage)
  const addBlankPage = useViewer((s) => s.addBlankPage)
  const reorderPage = useViewer((s) => s.reorderPage)
  const duplicatePage = useViewer((s) => s.duplicatePage)

  const persistChange = useCallback(async (newOrder: any[]) => {
    try {
      await updatePageOrder({ documentId, pageOrder: newOrder }).unwrap()
    } catch (error) {
      console.error("Failed to persist page order:", error)
      toast.error("Failed to save page changes")
    }
  }, [documentId, updatePageOrder])

  const handleRotate = useCallback((index: number, degrees: 90 | -90) => {
    rotatePage(index, degrees)
    // We need the state AFTER the update. Since zustand update is synchronous:
    // But wait, the state in the hook might be stale.
    // Better to use the store's subscribe or just compute it here.
  }, [rotatePage])

  // Actually, it's better if the store itself handles the persistence or we use a subscriber.
  
  return {
    persistChange
  }
}
