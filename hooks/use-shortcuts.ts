"use client"

import { useEffect, useCallback, useRef } from "react"
import type { ShortcutDefinition } from "@/features/shortcuts/definitions"

export type { ShortcutDefinition }

// Global registry for the help overlay to consume
const registry: Map<string, ShortcutDefinition> = new Map()

type Handler = () => void

export function useShortcuts(
  shortcuts: Array<ShortcutDefinition & { handler: Handler }>,
  enabled = true
) {
  // Sync with global registry for help overlay visibility
  useEffect(() => {
    shortcuts.forEach((s) => {
      registry.set(`${s.category}:${s.key}`, s)
    })

    return () => {
      shortcuts.forEach((s) => {
        registry.delete(`${s.category}:${s.key}`)
      })
    }
  }, [shortcuts])

  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabledRef.current) return

      const target = e.target as HTMLElement
      const inInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable

      for (const shortcut of shortcuts) {
        // Skip if we are in an input and this shortcut doesn't allow it
        if (inInput && !shortcut.allowInInput) continue

        if (matchesShortcut(e, shortcut.key)) {
          e.preventDefault()
          e.stopPropagation()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true) // Use capture phase for reliability
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [handleKeyDown])
}

/**
 * Robust shortcut matcher
 */
function matchesShortcut(e: KeyboardEvent, key: string): boolean {
  const parts = key.toLowerCase().split("+")
  
  const needsCtrl = parts.includes("ctrl") || parts.includes("cmd") || parts.includes("mod")
  const needsShift = parts.includes("shift")
  const needsAlt = parts.includes("alt")
  const mainKey = parts[parts.length - 1]

  // On Mac, Ctrl often means Meta/Cmd
  const ctrlOrMeta = e.ctrlKey || e.metaKey

  if (needsCtrl && !ctrlOrMeta) return false
  if (!needsCtrl && ctrlOrMeta) return false // Prevent Ctrl+S from triggering just S

  if (needsShift !== e.shiftKey) return false
  if (needsAlt !== e.altKey) return false

  // Normalize key names (e.g., "+" vs "equal")
  const pressedKey = e.key.toLowerCase()
  
  if (mainKey === "+" && (pressedKey === "+" || pressedKey === "=")) return true
  if (mainKey === "-" && pressedKey === "-") return true
  
  return pressedKey === mainKey
}

export function getRegisteredShortcuts(): ShortcutDefinition[] {
  return Array.from(registry.values())
}

