import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { attachSessionCookie, getRequestMeta } from "@/lib/auth/session"
import { SignInSchema } from "@/features/auth/schema"
import { signIn } from "@/features/auth/service"
import { enforceRateLimit } from "@/lib/ratelimit"

export const POST = withErrorHandling(async (req) => {
  const meta = await getRequestMeta()
  await enforceRateLimit(meta.ipAddress, "auth")
  const input = SignInSchema.parse(await req.json())
  const result = await signIn(input, meta)

  const response = NextResponse.json({
    data: {
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
      },
    },
  })

  return attachSessionCookie(response, result.session.id)
})
