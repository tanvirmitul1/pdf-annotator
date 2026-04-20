"use client"

import { useEffect } from "react"

import { setTheme, type ThemeMode } from "@/features/theme/slice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"

function resolveTheme(theme: ThemeMode) {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  return theme
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.value)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const stored = window.localStorage.getItem("pdf-annotator-theme") as ThemeMode | null
    if (stored === "light" || stored === "dark" || stored === "system") {
      dispatch(setTheme(stored))
    }
  }, [dispatch])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem("pdf-annotator-theme", theme)
    document.documentElement.setAttribute("data-theme", resolveTheme(theme))
  }, [theme])

  return children
}
