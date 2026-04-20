import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { revokeOtherSessions } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"

export const POST = withErrorHandling(async () => {
  const { session, user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const revoked = await revokeOtherSessions(user.id, session.id)

  return NextResponse.json({ data: { revoked } })
})
