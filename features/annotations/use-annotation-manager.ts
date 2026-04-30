import { useCallback, useEffect, useRef } from "react"
import { generateUUID } from "@/lib/utils/uuid"
import { useDispatch } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { useAppSelector } from "@/store/hooks"
import { annotationsApi } from "./api"
import type { CreateAnnotationArg } from "./api"
import type { AnnotationWithTags } from "./types"
import { addLocalAnnotation, markSynced, markFailed } from "./local-slice"

const FLUSH_DELAY_MS = 5_000
const MAX_BATCH_SIZE = 50

interface PendingAnnotation {
  clientId: string
  payload: CreateAnnotationArg
}

/**
 * Local-first annotation manager.
 *
 * Annotations appear instantly in the RTK Query cache (zero server wait).
 * A debounced flush sends pending annotations to the server via bulk API
 * every 2 seconds. Server responses only confirm IDs — no re-render needed.
 */
export function useAnnotationManager(documentId: string) {
  const dispatch = useDispatch<AppDispatch>()
  const currentUser = useAppSelector((state: RootState) => state.auth.user)

  // Mutable refs — never trigger re-renders
  const bufferRef = useRef<PendingAnnotation[]>([])
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushingRef = useRef(false)
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  // Stable ref to flush function — avoids circular useCallback deps
  const flushRef = useRef(doFlush)
  flushRef.current = doFlush

  // Schedule a flush after FLUSH_DELAY_MS
  const scheduleFlush = useCallback(() => {
    if (flushTimerRef.current) return // Already scheduled
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      void flushRef.current()
    }, FLUSH_DELAY_MS)
  }, [])

  // Core flush logic — uses refs to avoid dependency issues
  async function doFlush() {
    if (flushingRef.current || bufferRef.current.length === 0) return
    flushingRef.current = true

    const batch = bufferRef.current.splice(0, MAX_BATCH_SIZE)
    const d = dispatchRef.current

    if (batch.length === 0) {
      flushingRef.current = false
      return
    }

    try {
      // Extract documentId from first item (all items in batch share same documentId)
      const documentId = batch[0].payload.documentId

      const response = await d(
        annotationsApi.endpoints.bulkCreateAnnotations.initiate({
          documentId,
          annotations: batch.map((item) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { documentId: _unused, ...rest } = item.payload
            return {
              ...rest,
              clientId: item.clientId,
            }
          }),
        })
      ).unwrap()

      // Map server IDs back — update cache entries with real IDs
      response.forEach((result, idx) => {
        const pending = batch[idx]
        if (!pending) return

        d(markSynced({ clientId: pending.clientId, serverId: result.id }))

        // Swap local-${clientId} → server ID in the cache (silent)
        d(
          annotationsApi.util.updateQueryData(
            "listByDocument",
            pending.payload.documentId,
            (draft) => {
              const entry = draft.find(
                (a) => a.id === `local-${pending.clientId}`
              )
              if (entry) {
                entry.id = result.id
              }
            }
          )
        )
      })
    } catch (error) {
      // Mark all as failed, put them back for retry
      batch.forEach((item) => {
        d(markFailed({ clientId: item.clientId }))
      })
      bufferRef.current.unshift(...batch)
      console.error("[AnnotationManager] Bulk sync failed:", error)
    } finally {
      flushingRef.current = false

      // If more items accumulated while flushing, schedule another flush
      if (bufferRef.current.length > 0) {
        scheduleFlush()
      }
    }
  }

  // Flush on unmount (page navigation)
  useEffect(() => {
    const buffer = bufferRef.current
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
        flushTimerRef.current = null
      }
      // Best-effort flush via sendBeacon
      if (buffer.length > 0) {
        const pending = buffer.splice(0)
        const firstDocId = pending[0]?.payload.documentId
        if (firstDocId) {
          navigator.sendBeacon(
            `/api/annotations/bulk`,
            new Blob(
              [
                JSON.stringify({
                  documentId: firstDocId,
                  annotations: pending.map((item) => {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { documentId: _unused, ...rest } = item.payload
                    return {
                      ...rest,
                      clientId: item.clientId,
                    }
                  }),
                }),
              ],
              { type: "application/json" }
            )
          )
        }
      }
    }
  }, [documentId])

  /**
   * Add annotation — instant local appearance, background server sync.
   * Returns the local ID used in the cache.
   */
  const addAnnotation = useCallback(
    (annotation: Omit<CreateAnnotationArg, "clientId">) => {
      const clientId = generateUUID()
      const localId = `local-${clientId}`

      // 1. Track sync status
      dispatch(addLocalAnnotation({ clientId }))

      // 2. Immediately insert into RTK Query cache — zero network wait
      dispatch(
        annotationsApi.util.updateQueryData(
          "listByDocument",
          annotation.documentId,
          (draft) => {
            const optimistic: AnnotationWithTags = {
              id: localId,
              clientId,
              userId: currentUser?.id ?? "local",
              documentId: annotation.documentId,
              pageNumber: annotation.pageNumber,
              type: annotation.type,
              status: annotation.status ?? "OPEN",
              color: annotation.color,
              positionData: annotation.positionData,
              content: annotation.content ?? null,
              deletedAt: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: [],
              author: currentUser
                ? {
                    id: currentUser.id,
                    name: currentUser.name,
                    email: currentUser.email,
                    image: currentUser.image,
                  }
                : null,
              assignee: null,
            }
            draft.push(optimistic)
          }
        )
      )

      // 3. Buffer for batch sync (no server call now)
      bufferRef.current.push({
        clientId,
        payload: annotation as CreateAnnotationArg,
      })

      // 4. Schedule debounced flush
      scheduleFlush()

      return localId
    },
    [currentUser, dispatch, scheduleFlush]
  )

  /**
   * Force immediate flush (e.g., before page unload or when user wants to share)
   */
  const flushNow = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
    void flushRef.current()
  }, [])

  /**
   * Get count of pending annotations (for UI indicators)
   */
  const getPendingCount = useCallback(() => bufferRef.current.length, [])

  return {
    addAnnotation,
    flushNow,
    getPendingCount,
  }
}
