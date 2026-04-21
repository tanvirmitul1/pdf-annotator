import { useEffect, useRef } from "react"

/**
 * Hook that merges guest documents into the authenticated account.
 * This runs once per session when the user first accesses the app after login.
 */
export function useMergeGuestDocuments() {
  const mergeAttempted = useRef(false)

  useEffect(() => {
    if (mergeAttempted.current) return

    mergeAttempted.current = true

    const merge = async () => {
      try {
        await fetch("/api/auth/merge", { method: "POST" })
      } catch {
        // Silently fail - user is authenticated regardless
      }
    }

    merge()
  }, [])
}
