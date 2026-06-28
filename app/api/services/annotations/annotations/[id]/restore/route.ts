import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { restoreAnnotation } from "@/features/annotations/service"

export const POST = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const identity = await requireRequestIdentity(req)
    await enforceRateLimit(req, identity.userId, "annotation-write")

    const annotation = await restoreAnnotation(identity.userId, id)

    await logAudit({
      userId: identity.userId,
      action: "annotation.restore",
      resourceType: "Annotation",
      resourceId: id,
      metadata: { type: annotation.type },
      ipAddress: getIpAddress(req),
    })

    void track(identity.userId, "annotation_restored", { type: annotation.type })

    return NextResponse.json({ data: annotation })
  }
)

