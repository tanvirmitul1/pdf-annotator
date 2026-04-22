import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
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
    const user = await requireUser()
    await enforceRateLimit(req, user.id, "annotation-write")

    await removeTagFromAnnotation(user.id, annotationId, tagId)

    await logAudit({
      userId: user.id,
      action: "annotation.tag.remove",
      resourceType: "Annotation",
      resourceId: annotationId,
      metadata: { tagId },
      ipAddress: getIpAddress(req),
    })

    void track(user.id, "annotation_updated", { field: "tags" })

    return NextResponse.json({ data: null })
  }
)
