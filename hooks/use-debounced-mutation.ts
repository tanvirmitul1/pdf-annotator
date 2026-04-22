"use client"

import { useCallback, useEffect, useRef } from "react"

/**
 * Returns { call, flush } where:
 * - `call(arg)` debounces the mutation by `delay` ms
 * - `flush()` fires immediately with the latest arg
 *
 * Automatically flushes on unmount.
 */
export function useDebouncedMutation<A>(
  trigger: (arg: A) => unknown,
  delay = 300
) {
  const latestArg = useRef<A | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const call = useCallback(
    (arg: A) => {
      latestArg.current = arg
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        if (latestArg.current !== null) {
          trigger(latestArg.current)
          latestArg.current = null
        }
      }, delay)
    },
    [trigger, delay]
  )

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (latestArg.current !== null) {
      trigger(latestArg.current)
      latestArg.current = null
    }
  }, [trigger])

  // Flush on unmount
  useEffect(() => () => flush(), [flush])

  return { call, flush }
}
