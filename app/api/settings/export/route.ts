import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { requestDataExport } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"
import { accountRepository } from "@/lib/db/repositories/account"

export const POST = withErrorHandling(async () => {
  const { session, user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const job = await requestDataExport(user.id, user.email, user.displayName)

  accountRepository().createAuditLog({
    userId: user.id,
    action: "export.run",
    resourceType: "ExportJob",
    resourceId: job.id,
    metadata: { kind: job.kind },
    ipAddress: session.ipAddress,
  })

  return NextResponse.json({
    data: {
      status: job.status,
      progress: job.progress,
      resultUrl: job.resultUrl,
      updatedAt: job.updatedAt,
    },
  })
})
