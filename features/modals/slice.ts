import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ModalState = {
  activeModal: string | null
  payload: Record<string, string> | null
}

const initialState: ModalState = {
  activeModal: null,
  payload: null,
}

const modalsSlice = createSlice({
  name: "modals",
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<{ id: string; payload?: Record<string, string> }>) {
      state.activeModal = action.payload.id
      state.payload = action.payload.payload ?? null
    },
    closeModal(state) {
      state.activeModal = null
      state.payload = null
    },
  },
})

export const { openModal, closeModal } = modalsSlice.actions
export const modalsReducer = modalsSlice.reducer
