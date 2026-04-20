import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { UnauthenticatedError } from "@/lib/errors"

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user?.id) {
    throw new UnauthenticatedError()
  }

  return user
}

export async function requireAppUser() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  return session
}
