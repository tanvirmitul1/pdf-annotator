import { cookies, headers } from "next/headers"
import { NextResponse } from "next/server"

import { accountRepository } from "@/lib/db/repositories/account"

export const SESSION_COOKIE_NAME = "pdf-annotator-session"

export async function getRequestMeta() {
  const headerStore = await headers()
  const forwardedFor = headerStore.get("x-forwarded-for")
  const userAgent = headerStore.get("user-agent") ?? "Browser session"

  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() ?? "127.0.0.1",
    userAgent,
  }
}

export function describeSession(userAgent: string) {
  const source = userAgent.toLowerCase()

  if (source.includes("iphone") || source.includes("android")) {
    return "Mobile browser"
  }

  if (source.includes("firefox")) {
    return "Firefox on desktop"
  }

  if (source.includes("safari") && !source.includes("chrome")) {
    return "Safari on desktop"
  }

  if (source.includes("edg")) {
    return "Edge on desktop"
  }

  return "Chrome-like browser"
}

export async function readSessionId() {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null
}

export async function getSessionContext() {
  const sessionId = await readSessionId()

  if (!sessionId) {
    return null
  }

  const repository = accountRepository()
  const session = repository.touchSession(sessionId)

  if (!session || session.revokedAt) {
    return null
  }

  const user = repository.getUserById(session.userId)

  if (!user) {
    return null
  }

  return { session, user }
}

export function attachSessionCookie(response: NextResponse, sessionId: string) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  })

  return response
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  })

  return response
}
