import { cookies } from "next/headers"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"

import { auth } from "@/auth"
import {
  DEVICE_COOKIE_NAME,
  getOrCreateGuestUserByDeviceToken,
  mergeAnonymousDeviceIntoUser,
  readDeviceTokenFromServerCookies,
  resolveOptionalIdentityFromRequest,
} from "@/lib/device/identity"
import { getIpAddressFromRequestHeaders } from "@/lib/request"
import { UnauthenticatedError } from "@/lib/errors"
import { extractBearerToken, verifyApiKey } from "@/lib/auth/api-keys"

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

export async function getCurrentIdentity() {
  const session = await auth()
  if (session?.user?.id) {
    const cookieStore = await cookies()
    const headerStore = await headers()
    const deviceToken = cookieStore.get(DEVICE_COOKIE_NAME)?.value ?? null

    await mergeAnonymousDeviceIntoUser({
      targetUserId: session.user.id,
      deviceToken,
      ipAddress: getIpAddressFromRequestHeaders(headerStore),
    })

    return {
      userId: session.user.id,
      isAnonymous: false,
      user: session.user,
      deviceToken,
    }
  }

  const deviceToken = await readDeviceTokenFromServerCookies()
  if (!deviceToken) {
    return null
  }

  const headerStore = await headers()
  const guest = await getOrCreateGuestUserByDeviceToken(
    deviceToken,
    getIpAddressFromRequestHeaders(headerStore)
  )

  return {
    userId: guest.id,
    isAnonymous: true,
    user: null,
    deviceToken,
  }
}

export async function requireRequestIdentity(request: NextRequest) {
  // 1. Try cookie-based session first
  const session = await auth()
  const identity = await resolveOptionalIdentityFromRequest(
    request,
    session?.user?.id ?? null
  )

  if (identity) {
    return identity
  }

  // 2. Fall back to Bearer token (for desktop/mobile/API clients)
  const bearerToken = extractBearerToken(request.headers.get("authorization"))
  if (bearerToken) {
    const userId = await verifyApiKey(bearerToken)
    return {
      userId,
      isAnonymous: false as const,
      cookieWasCreated: false as const,
      deviceToken: null,
    }
  }

  throw new UnauthenticatedError()
}
