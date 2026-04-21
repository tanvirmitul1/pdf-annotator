"use client"

import { Moon, Sun } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setTheme } from "@/features/theme/slice"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const dispatch = useAppDispatch()
  const theme = useAppSelector((state) => state.theme.value)

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark"
    dispatch(setTheme(newTheme))
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="size-9 rounded-full"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="size-4" />
      ) : (
        <Moon className="size-4" />
      )}
    </Button>
  )
}
