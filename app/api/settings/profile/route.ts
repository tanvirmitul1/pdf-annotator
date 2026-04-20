import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireSessionContext } from "@/lib/auth/require"
import { UpdateProfileSchema } from "@/features/settings/schema"
import { updateProfile } from "@/features/settings/service"
import { enforceRateLimit } from "@/lib/ratelimit"
import { accountRepository } from "@/lib/db/repositories/account"
import { track } from "@/lib/analytics"

export const PATCH = withErrorHandling(async (req) => {
  const { session, user } = await requireSessionContext()
  await enforceRateLimit(user.id, "settings")
  const input = UpdateProfileSchema.parse(await req.json())
  const updatedUser = await updateProfile(user.id, input.displayName)
  const repository = accountRepository()
  repository.createAuditLog({
    userId: user.id,
    action: "profile.update",
    resourceType: "User",
    resourceId: user.id,
    metadata: { displayName: updatedUser?.displayName },
    ipAddress: session.ipAddress,
  })
  track(user.id, "profile_updated", {})

  return NextResponse.json({
    data: {
      displayName: updatedUser?.displayName,
    },
  })
})
