import { useState, useEffect } from "react"

export function useCoarsePointer() {
  const [isCoarse, setIsCoarse] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return
    const media = window.matchMedia("(pointer: coarse)")
    const update = () => setIsCoarse(media.matches)
    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  return isCoarse
}
