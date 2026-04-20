import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { RevokeSessionSchema } from "@/features/settings/schema"
import { revokeSession } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"

export const POST = withErrorHandling(async (req) => {
  const { user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const input = RevokeSessionSchema.parse(await req.json())
  const session = await revokeSession(user.id, input.sessionId)

  return NextResponse.json({
    data: {
      sessionId: session.id,
    },
  })
})
