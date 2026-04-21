"use client"

import { useEffect } from "react"
import * as Sentry from "@sentry/nextjs"
import { SessionProvider } from "next-auth/react"
import { Provider } from "react-redux"
import { Toaster } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"
import { initPostHogClient } from "@/lib/analytics/client"
import { setSession, store } from "@/store"

export function Providers({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    planId?: string
  } | null
}) {
  useEffect(() => {
    store.dispatch(
      setSession(
        initialUser
          ? {
              id: initialUser.id,
              name: initialUser.name ?? null,
              email: initialUser.email ?? null,
              image: initialUser.image ?? null,
              planId: initialUser.planId ?? "free",
            }
          : null
      )
    )
  }, [initialUser])

  useEffect(() => {
    initPostHogClient()
  }, [])

  return (
    <Sentry.ErrorBoundary
      fallback={
        <p className="p-6 text-sm text-destructive">Something went wrong.</p>
      }
    >
      <SessionProvider>
        <Provider store={store}>
          <ThemeProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </Provider>
      </SessionProvider>
    </Sentry.ErrorBoundary>
  )
}
