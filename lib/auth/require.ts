import { redirect } from "next/navigation"

import { getSessionContext } from "@/lib/auth/session"
import { UnauthenticatedError } from "@/lib/errors"

export async function requireUser() {
  const context = await getSessionContext()

  if (!context) {
    throw new UnauthenticatedError()
  }

  return context.user
}

export async function requireSessionContext() {
  const context = await getSessionContext()

  if (!context) {
    throw new UnauthenticatedError()
  }

  return context
}

export async function requireAppUser() {
  const context = await getSessionContext()

  if (!context) {
    redirect("/login")
  }

  return context
}
