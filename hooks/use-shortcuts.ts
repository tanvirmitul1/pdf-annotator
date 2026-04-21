"use client"

import { useEffect, useCallback, useRef } from "react"

export interface ShortcutDef {
  key: string
  label: string
  category: string
  description: string
  /** Run this shortcut even when an input is focused */
  allowInInput?: boolean
}

const registry: ShortcutDef[] = []
type Handler = () => void

const handlers: Map<string, Handler> = new Map()

export function useShortcuts(
  shortcuts: Array<ShortcutDef & { handler: Handler }>,
  enabled = true
) {
  // Register definitions for help overlay
  useEffect(() => {
    shortcuts.forEach((s) => {
      const existing = registry.findIndex((r) => r.key === s.key)
      if (existing >= 0) {
        registry[existing] = s
      } else {
        registry.push(s)
      }
      handlers.set(s.key, s.handler)
    })

    return () => {
      shortcuts.forEach((s) => {
        handlers.delete(s.key)
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
        if (inInput && !shortcut.allowInInput) continue
        if (matchesShortcut(e, shortcut.key)) {
          e.preventDefault()
          shortcut.handler()
          return
        }
      }
    },
    [shortcuts]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])
}

function matchesShortcut(e: KeyboardEvent, key: string): boolean {
  const parts = key.toLowerCase().split("+")
  const needsCtrl = parts.includes("ctrl") || parts.includes("cmd")
  const needsShift = parts.includes("shift")
  const needsAlt = parts.includes("alt")
  const mainKey = parts[parts.length - 1]

  const ctrlOrMeta = e.ctrlKey || e.metaKey

  if (needsCtrl && !ctrlOrMeta) return false
  if (!needsCtrl && ctrlOrMeta) return false
  if (needsShift !== e.shiftKey) return false
  if (needsAlt !== e.altKey) return false

  return e.key.toLowerCase() === mainKey
}

export function getRegisteredShortcuts(): ShortcutDef[] {
  return [...registry]
}
