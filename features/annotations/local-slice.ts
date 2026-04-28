import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type AnnotationSyncStatus = "pending" | "synced" | "failed"

export interface LocalAnnotationState {
  clientId: string
  serverId?: string
  status: AnnotationSyncStatus
  createdAt: number
}

interface LocalAnnotationsState {
  map: Record<string, LocalAnnotationState>
}

const initialState: LocalAnnotationsState = {
  map: {},
}

export const localAnnotationsSlice = createSlice({
  name: "localAnnotations",
  initialState,
  reducers: {
    /**
     * Track a new local annotation
     */
    addLocalAnnotation: (
      state,
      action: PayloadAction<{ clientId: string }>
    ) => {
      state.map[action.payload.clientId] = {
        clientId: action.payload.clientId,
        status: "pending",
        createdAt: Date.now(),
      }
    },

    /**
     * Mark annotation as synced with server
     */
    markSynced: (
      state,
      action: PayloadAction<{ clientId: string; serverId: string }>
    ) => {
      const local = state.map[action.payload.clientId]
      if (local) {
        local.status = "synced"
        local.serverId = action.payload.serverId
      }
    },

    /**
     * Mark annotation as failed to sync
     */
    markFailed: (state, action: PayloadAction<{ clientId: string }>) => {
      const local = state.map[action.payload.clientId]
      if (local) {
        local.status = "failed"
      }
    },

    /**
     * Remove local annotation tracking
     */
    removeLocalAnnotation: (
      state,
      action: PayloadAction<{ clientId: string }>
    ) => {
      delete state.map[action.payload.clientId]
    },

    /**
     * Clear all local annotations (e.g., on document change)
     */
    clearLocalAnnotations: (state) => {
      state.map = {}
    },
  },
})

export const {
  addLocalAnnotation,
  markSynced,
  markFailed,
  removeLocalAnnotation,
  clearLocalAnnotations,
} = localAnnotationsSlice.actions

export default localAnnotationsSlice.reducer
