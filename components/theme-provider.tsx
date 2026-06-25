"use client"

import { useEffect, useRef } from "react"

import { type ThemeMode } from "@/features/theme/slice"
import { useAppSelector } from "@/store/hooks"

function resolveTheme(theme: ThemeMode): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector((state) => state.theme.value)
  const isFirstRender = useRef(true)

  useEffect(() => {
    // Skip the very first render — the blocking <script> already set the
    // correct data-theme before React hydrated. Applying the redux initial
    // state ("system") here would flash to the wrong theme before
    // redux-persist rehydrates the real value.
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    document.documentElement.setAttribute("data-theme", resolveTheme(theme))
  }, [theme])

  return children
}
