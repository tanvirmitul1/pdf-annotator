import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { attachSessionCookie } from "@/lib/auth/session"
import { getRequestMeta } from "@/lib/auth/session"
import { SignUpSchema } from "@/features/auth/schema"
import { signUp } from "@/features/auth/service"
import { enforceRateLimit } from "@/lib/ratelimit"

export const POST = withErrorHandling(async (req) => {
  const meta = await getRequestMeta()
  await enforceRateLimit(meta.ipAddress, "auth")
  const input = SignUpSchema.parse(await req.json())
  const result = await signUp(input, meta)

  const response = NextResponse.json(
    {
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
        },
      },
    },
    { status: 201 }
  )

  return attachSessionCookie(response, result.session.id)
})
