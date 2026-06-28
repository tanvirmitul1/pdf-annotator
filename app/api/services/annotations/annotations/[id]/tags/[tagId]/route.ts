import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { removeTagFromAnnotation } from "@/features/annotations/service"

// ─── DELETE /api/annotations/[id]/tags/[tagId] ───────────────────────────────

export const DELETE = withErrorHandling(
  async (
    req: NextRequest,
    ctx: { params: Promise<{ id: string; tagId: string }> }
  ) => {
    const { id: annotationId, tagId } = await ctx.params
    const identity = await requireRequestIdentity(req)
    await enforceRateLimit(req, identity.userId, "annotation-write")

    await removeTagFromAnnotation(identity.userId, annotationId, tagId)

    await logAudit({
      userId: identity.userId,
      action: "annotation.tag.remove",
      resourceType: "Annotation",
      resourceId: annotationId,
      metadata: { tagId },
      ipAddress: getIpAddress(req),
    })

    void track(identity.userId, "annotation_updated", { field: "tags" })

    return NextResponse.json({ data: null })
  }
)
