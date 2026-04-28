import { useCallback, useRef } from "react"
import { useDispatch } from "react-redux"
import type { AppDispatch } from "@/store"
import { useCreateAnnotationMutation } from "./api"
import { addLocalAnnotation, markSynced, markFailed } from "./local-slice"
import type { CreateAnnotationArg } from "./api"
import { MutationQueue } from "./mutation-queue"

/**
 * Hook for managing optimistic annotation creation with mutation queue.
 * 
 * Usage:
 * - Instant UI feedback (optimistic)
 * - Queued server sync (no race conditions)
 * - Automatic retry on failure
 */
export function useAnnotationManager() {
  const dispatch = useDispatch<AppDispatch>()
  const queueRef = useRef<MutationQueue | null>(null)

  // Initialize queue once
  if (!queueRef.current) {
    queueRef.current = new MutationQueue(dispatch)
  }

  // We still need the mutation endpoint for the queue to use
  const [createAnnotation] = useCreateAnnotationMutation()

  /**
   * Add annotation with optimistic UI and queued sync
   */
  const addAnnotation = useCallback(
    (annotation: Omit<CreateAnnotationArg, "clientId">) => {
      const clientId = crypto.randomUUID()

      // 1. Track locally for sync status
      dispatch(addLocalAnnotation({ clientId }))

      // 2. Optimistic update is handled by RTK Query's onQueryStarted
      // The mutation will add to cache immediately

      // 3. Enqueue for server sync
      queueRef.current!.enqueue({
        clientId,
        payload: {
          ...annotation,
          // clientId will be added by the API layer
        },

        onSuccess: (serverId) => {
          // Mark as synced
          dispatch(markSynced({ clientId, serverId }))
        },

        onError: (error) => {
          // Mark as failed
          console.error("[AnnotationManager] Sync failed:", error)
          dispatch(markFailed({ clientId }))
        },
      })

      return clientId
    },
    [dispatch]
  )

  /**
   * Retry a failed annotation
   */
  const retryAnnotation = useCallback(
    (clientId: string, annotation: Omit<CreateAnnotationArg, "clientId">) => {
      // Reset to pending
      dispatch(addLocalAnnotation({ clientId }))

      // Re-enqueue
      queueRef.current!.enqueue({
        clientId,
        payload: annotation,
        onSuccess: (serverId) => {
          dispatch(markSynced({ clientId, serverId }))
        },
        onError: (error) => {
          console.error("[AnnotationManager] Retry failed:", error)
          dispatch(markFailed({ clientId }))
        },
      })
    },
    [dispatch]
  )

  return {
    addAnnotation,
    retryAnnotation,
    queue: queueRef.current,
  }
}
