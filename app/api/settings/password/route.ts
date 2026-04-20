import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { ChangePasswordSchema } from "@/features/settings/schema"
import { changePassword } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"
import { accountRepository } from "@/lib/db/repositories/account"

export const POST = withErrorHandling(async (req) => {
  const { session, user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const input = ChangePasswordSchema.parse(await req.json())
  await changePassword(user.id, input)

  accountRepository().createAuditLog({
    userId: user.id,
    action: "password.change",
    resourceType: "User",
    resourceId: user.id,
    metadata: {},
    ipAddress: session.ipAddress,
  })

  return NextResponse.json({ data: { ok: true } })
})
