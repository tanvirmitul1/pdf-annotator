import { cookies } from "next/headers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { auth } from "@/auth"
import { DEVICE_COOKIE_NAME, mergeAnonymousDeviceIntoUser } from "@/lib/device/identity"
import { getIpAddressFromRequestHeaders } from "@/lib/request"
import { UnauthenticatedError } from "@/lib/errors"

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) {
    return null
  }

  const cookieStore = await cookies()
  const headerStore = await headers()
  const deviceToken = cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? null

  await mergeAnonymousDeviceIntoUser({
    targetUserId: session.user.id,
    deviceToken,
    ipAddress: getIpAddressFromRequestHeaders(headerStore),
  })

  return session.user
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
