import { combineReducers, configureStore, createListenerMiddleware } from "@reduxjs/toolkit"
import { REHYDRATE, persistReducer, persistStore } from "redux-persist"
import createWebStorage from "redux-persist/lib/storage/createWebStorage"

import { api } from "@/store/api"
import { authReducer, setSession } from "@/features/auth/slice"
import { modalsReducer } from "@/features/modals/slice"
import { themeReducer, themeSlice, type ThemeMode } from "@/features/theme/slice"
import { toastsReducer } from "@/features/toasts/slice"
import localAnnotationsReducer from "@/features/annotations/local-slice"
import { conversationsApi } from "@/app/(platform)/services/ai-chat/_store/conversations-api"

const createNoopStorage = () => ({
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
})

const storage =
  typeof window === "undefined" ? createNoopStorage() : createWebStorage("local")

function applyThemeToDOM(theme: ThemeMode) {
  if (typeof document === "undefined") return
  const resolved =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme
  document.documentElement.setAttribute("data-theme", resolved)
}

const listenerMiddleware = createListenerMiddleware()

// Apply theme to DOM on explicit setTheme actions
listenerMiddleware.startListening({
  actionCreator: themeSlice.actions.setTheme,
  effect: async (action) => {
    applyThemeToDOM(action.payload)
  },
})

// Apply theme to DOM when redux-persist rehydrates the theme slice
listenerMiddleware.startListening({
  predicate: (action) => action.type === REHYDRATE,
  effect: async (action) => {
    const a = action as unknown as { key?: string; payload?: { value?: ThemeMode } }
    if (a.key === "theme" && a.payload?.value) {
      applyThemeToDOM(a.payload.value)
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
  [conversationsApi.reducerPath]: conversationsApi.reducer,
  auth: authReducer,
  theme: persistedThemeReducer,
  toasts: toastsReducer,
  modals: modalsReducer,
  localAnnotations: localAnnotationsReducer,
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
      }).concat(api.middleware, conversationsApi.middleware, listenerMiddleware.middleware),
  })
}

export const store = makeStore()
export const persistor = persistStore(store)

export type AppStore = typeof store
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
export { setSession }
