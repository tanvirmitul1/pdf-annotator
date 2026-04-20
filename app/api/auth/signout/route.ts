import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { clearSessionCookie, readSessionId } from "@/lib/auth/session"
import { signOut } from "@/features/auth/service"

export const POST = withErrorHandling(async () => {
  const sessionId = await readSessionId()
  await signOut(sessionId)

  const response = NextResponse.json({ data: { ok: true } })
  return clearSessionCookie(response)
})
