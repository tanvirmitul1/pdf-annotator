import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type ToastItem = {
  id: string
  title: string
  description?: string
}

type ToastState = {
  queue: ToastItem[]
}

const initialState: ToastState = {
  queue: [],
}

const toastsSlice = createSlice({
  name: "toasts",
  initialState,
  reducers: {
    enqueueToast(state, action: PayloadAction<ToastItem>) {
      state.queue.push(action.payload)
    },
    dismissToast(state, action: PayloadAction<string>) {
      state.queue = state.queue.filter((item) => item.id !== action.payload)
    },
  },
})

export const { enqueueToast, dismissToast } = toastsSlice.actions
export const toastsReducer = toastsSlice.reducer
