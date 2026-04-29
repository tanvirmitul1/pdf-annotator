import { useCallback } from "react"
import { useAppDispatch } from "@/store/hooks"
import { enqueueToast } from "@/features/toasts/slice"

interface ToastOptions {
  title: string
  description?: string
  variant?: "default" | "destructive"
}

export function useToast() {
  const dispatch = useAppDispatch()

  const toast = useCallback(
    ({ title, description, variant }: ToastOptions) => {
      dispatch(
        enqueueToast({
          id: Math.random().toString(36).slice(2),
          title: variant === "destructive" ? `Error: ${title}` : title,
          description,
        })
      )
    },
    [dispatch]
  )

  return { toast }
}
