import { useCallback, useEffect, useRef } from "react"
import { generateUUID } from "@/lib/utils/uuid"
import { useDispatch } from "react-redux"
import type { AppDispatch, RootState } from "@/store"
import { useAppSelector } from "@/store/hooks"
import { useViewer } from "@/features/viewer/provider"
import { annotationsApi } from "./api"
import type { CreateAnnotationArg, UpdateAnnotationArg, DeleteAnnotationArg } from "./api"
import type { AnnotationWithTags, PositionData } from "./types"
import { addLocalAnnotation, markSynced, markFailed } from "./local-slice"

const FLUSH_DELAY_MS = 10_000 // 10 seconds as requested
const MAX_BATCH_SIZE = 100

type SyncOperation = 
  | { type: "create"; clientId: string; payload: Omit<CreateAnnotationArg, "documentId"> }
  | { type: "update"; id: string; payload: Omit<UpdateAnnotationArg, "id" | "documentId"> }
  | { type: "delete"; id: string }
  | { type: "restore"; id: string }

/**
 * Local-first annotation manager with bulk sync.
 *
 * All operations (create, update, delete) are first applied optimistically to the local RTK Query cache.
 * They are then buffered and sent to the server in a single bulk sync request.
 * If autosave is enabled, flushes happen every 10 seconds.
 */
export function useAnnotationManager(documentId: string) {
  const dispatch = useDispatch<AppDispatch>()
  const currentUser = useAppSelector((state: RootState) => state.auth.user)
  const autosaveEnabled = useViewer((s) => s.autosaveEnabled)

  // Mutable refs — never trigger re-renders
  const bufferRef = useRef<SyncOperation[]>([])
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flushingRef = useRef(false)
  
  const dispatchRef = useRef(dispatch)
  dispatchRef.current = dispatch

  // Stable ref to flush function — avoids circular useCallback deps
  const flushRef = useRef(doFlush)
  flushRef.current = doFlush

  // Schedule a flush after FLUSH_DELAY_MS if autosave is enabled
  const scheduleFlush = useCallback(() => {
    if (!autosaveEnabled) return
    if (flushTimerRef.current) return // Already scheduled
    
    flushTimerRef.current = setTimeout(() => {
      flushTimerRef.current = null
      void flushRef.current()
    }, FLUSH_DELAY_MS)
  }, [autosaveEnabled])

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
      const response = await d(
        annotationsApi.endpoints.bulkSyncAnnotations.initiate({
          documentId,
          operations: batch.map((op) => {
            if (op.type === "create") {
              return { type: "create", clientId: op.clientId, payload: op.payload }
            }
            if (op.type === "update") {
              return { type: "update", id: op.id, payload: op.payload }
            }
            return op
          }),
        })
      ).unwrap()

      // Process results
      response.forEach((result, idx) => {
        const op = batch[idx]
        if (op.type === "create" && result.status === "created") {
          d(markSynced({ clientId: op.clientId, serverId: result.serverId }))
          
          // Swap local ID for server ID in cache
          d(
            annotationsApi.util.updateQueryData("listByDocument", documentId, (draft) => {
              const entry = draft.find(a => a.id === `local-${op.clientId}`)
              if (entry) entry.id = result.serverId
            })
          )

          // IMPORTANT: Update any pending operations in the buffer that reference this local ID!
          bufferRef.current.forEach(pendingOp => {
            if ((pendingOp.type === "update" || pendingOp.type === "delete" || pendingOp.type === "restore") && pendingOp.id === `local-${op.clientId}`) {
              pendingOp.id = result.serverId
            }
          })
        }
      })
    } catch (error) {
      console.error("[AnnotationManager] Bulk sync failed:", error)
      // Put failed operations back at the front of the buffer
      bufferRef.current.unshift(...batch)
    } finally {
      flushingRef.current = false

      // If more items accumulated while flushing and autosave is on, schedule another
      if (bufferRef.current.length > 0 && autosaveEnabled) {
        scheduleFlush()
      }
    }
  }

  // Best-effort flush on unmount if there's data
  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        clearTimeout(flushTimerRef.current)
      }
      
      const pending = bufferRef.current.splice(0)
      if (pending.length > 0) {
        const payload = JSON.stringify({
          documentId,
          operations: pending.map((op) => {
            if (op.type === "create") {
              return { type: "create", clientId: op.clientId, payload: op.payload }
            }
            if (op.type === "update") {
              return { type: "update", id: op.id, payload: op.payload }
            }
            return op
          }),
        })
        
        navigator.sendBeacon("/api/annotations/sync", new Blob([payload], { type: "application/json" }))
      }
    }
  }, [documentId])

  /**
   * Add annotation — instant local appearance, background sync.
   */
  const addAnnotation = useCallback(
    (annotation: Omit<CreateAnnotationArg, "clientId">) => {
      const clientId = generateUUID()
      const localId = `local-${clientId}`

      dispatch(addLocalAnnotation({ clientId }))
      dispatch(
        annotationsApi.util.updateQueryData("listByDocument", annotation.documentId, (draft) => {
          const optimistic: AnnotationWithTags = {
            id: localId,
            clientId,
            userId: currentUser?.id ?? "local",
            documentId: annotation.documentId,
            pageNumber: annotation.pageNumber,
            type: annotation.type,
            status: annotation.status ?? "OPEN",
            color: annotation.color,
            positionData: annotation.positionData as PositionData,
            content: annotation.content ?? null,
            deletedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            tags: [],
            author: currentUser ? { ...currentUser } : null,
            assignee: null,
          }
          draft.push(optimistic)
        })
      )

      const { documentId, ...payloadWithoutDoc } = annotation
      bufferRef.current.push({ type: "create", clientId, payload: payloadWithoutDoc })
      scheduleFlush()
      return localId
    },
    [currentUser, dispatch, scheduleFlush]
  )

  /**
   * Update annotation — instant local change, background sync.
   */
  const updateAnnotation = useCallback(
    (arg: UpdateAnnotationArg) => {
      const { id, documentId, ...changes } = arg
      
      dispatch(
        annotationsApi.util.updateQueryData("listByDocument", documentId, (draft) => {
          const a = draft.find(item => item.id === id)
          if (a) Object.assign(a, changes)
        })
      )

      // Merging optimization: if updating a local (un-synced) item, merge with its create op
      if (id.startsWith("local-")) {
        const clientId = id.replace("local-", "")
        const createOp = bufferRef.current.find(op => op.type === "create" && op.clientId === clientId)
        if (createOp && createOp.type === "create") {
          Object.assign(createOp.payload, changes)
          return
        }
      }

      bufferRef.current.push({ type: "update", id, payload: changes })
      scheduleFlush()
    },
    [dispatch, scheduleFlush]
  )

  /**
   * Delete annotation — instant local removal, background sync.
   */
  const deleteAnnotation = useCallback(
    (arg: DeleteAnnotationArg) => {
      const { id, documentId } = arg
      
      dispatch(
        annotationsApi.util.updateQueryData("listByDocument", documentId, (draft) => {
          const idx = draft.findIndex(a => a.id === id)
          if (idx >= 0) draft.splice(idx, 1)
        })
      )

      // Merging optimization: if deleting a local (un-synced) item, remove its create op
      if (id.startsWith("local-")) {
        const clientId = id.replace("local-", "")
        const idx = bufferRef.current.findIndex(op => op.type === "create" && op.clientId === clientId)
        if (idx >= 0) {
          bufferRef.current.splice(idx, 1)
          return
        }
      }

      bufferRef.current.push({ type: "delete", id })
      scheduleFlush()
    },
    [dispatch, scheduleFlush]
  )

  /**
   * Restore annotation — background sync.
   */
  const restoreAnnotation = useCallback(
    (arg: DeleteAnnotationArg) => {
      const { id, documentId } = arg
      
      // We don't optimistically restore because we don't have the full data usually
      // but if it's already in the cache (just marked deleted), we can.
      // However, listByDocument usually filters out deleted.
      // For now, we just buffer it.
      bufferRef.current.push({ type: "restore", id })
      scheduleFlush()
    },
    [scheduleFlush]
  )

  /**
   * Force immediate flush
   */
  const flushNow = useCallback(() => {
    if (flushTimerRef.current) {
      clearTimeout(flushTimerRef.current)
      flushTimerRef.current = null
    }
    return doFlush()
  }, [])

  const getPendingCount = useCallback(() => bufferRef.current.length, [])

  return {
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    restoreAnnotation,
    flushNow,
    getPendingCount,
  }
}

