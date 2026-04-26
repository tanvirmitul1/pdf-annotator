import { createSlice, type PayloadAction } from "@reduxjs/toolkit"
import { api } from "@/store/api"

type SessionUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  planId: string
}

type AuthState = {
  user: SessionUser | null
}

const initialState: AuthState = {
  user: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setSession(state, action: PayloadAction<SessionUser | null>) {
      state.user = action.payload
    },
  },
})

export const { setSession } = authSlice.actions
export const authReducer = authSlice.reducer

// RTK Query endpoint for auth/me
export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query<{ authenticated: boolean; user: SessionUser | null }, void>({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
  }),
})

export const { useGetMeQuery } = authApi
