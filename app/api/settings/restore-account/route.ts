import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { restoreAccount } from "@/features/settings/service"
import { accountRepository } from "@/lib/db/repositories/account"

export const POST = withErrorHandling(async () => {
  const { session, user } = await requireSessionContext()
  const restoredUser = await restoreAccount(user.id)

  accountRepository().createAuditLog({
    userId: user.id,
    action: "account.restore",
    resourceType: "User",
    resourceId: user.id,
    metadata: {},
    ipAddress: session.ipAddress,
  })

  return NextResponse.json({
    data: {
      deletedAt: restoredUser?.deletedAt ?? null,
    },
  })
})
