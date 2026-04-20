import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit"
import { persistReducer, persistStore } from "redux-persist"
import createWebStorage from "redux-persist/lib/storage/createWebStorage"

import { api } from "@/store/api"
import { authReducer, setSession } from "@/features/auth/slice"
import { modalsReducer } from "@/features/modals/slice"
import { themeReducer, themeSlice } from "@/features/theme/slice"
import { toastsReducer } from "@/features/toasts/slice"

const createNoopStorage = () => ({
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
})

const storage =
  typeof window === "undefined" ? createNoopStorage() : createWebStorage("local")

const listenerMiddleware = createListenerMiddleware()

listenerMiddleware.startListening({
  actionCreator: themeSlice.actions.setTheme,
  effect: async (action) => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", action.payload)
    }
  },
})

const persistedThemeReducer = persistReducer(
  {
    key: "theme",
    storage,
    whitelist: ["value"],
  },
  themeReducer
)

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  auth: authReducer,
  theme: persistedThemeReducer,
  toasts: toastsReducer,
  modals: modalsReducer,
})

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        },
      }).concat(api.middleware, listenerMiddleware.middleware),
  })
}

export const store = makeStore()
export const persistor = persistStore(store)

export type AppStore = typeof store
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export { setSession }
