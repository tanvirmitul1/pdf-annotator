import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { DeleteAccountSchema } from "@/features/settings/schema"
import { scheduleAccountDeletion } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"
import { accountRepository } from "@/lib/db/repositories/account"

export const POST = withErrorHandling(async (req) => {
  const { session, user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const input = DeleteAccountSchema.parse(await req.json())
  const updatedUser = await scheduleAccountDeletion(user.id, input)

  accountRepository().createAuditLog({
    userId: user.id,
    action: "account.delete",
    resourceType: "User",
    resourceId: user.id,
    metadata: { deletedAt: updatedUser.deletedAt },
    ipAddress: session.ipAddress,
  })

  return NextResponse.json({
    data: {
      deletedAt: updatedUser.deletedAt,
    },
  })
})
