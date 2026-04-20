import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

export type ThemeMode = "light" | "dark" | "system"

type ThemeState = {
  value: ThemeMode
}

const initialState: ThemeState = {
  value: "system",
}

export const themeSlice = createSlice({
  name: "theme",
  initialState,
  reducers: {
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.value = action.payload
    },
  },
})

export const { setTheme } = themeSlice.actions
export const themeReducer = themeSlice.reducer
