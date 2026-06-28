import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { AddTagSchema } from "@/features/annotations/schema"
import { addTagToAnnotation } from "@/features/annotations/service"

// ─── POST /api/annotations/[id]/tags ─────────────────────────────────────────

export const POST = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: annotationId } = await ctx.params
    const identity = await requireRequestIdentity(req)
    await enforceRateLimit(req, identity.userId, "annotation-write")
    const { label } = AddTagSchema.parse(await req.json())

    const { created, tag } = await addTagToAnnotation(
      identity.userId,
      annotationId,
      label
    )

    await logAudit({
      userId: identity.userId,
      action: "annotation.tag.add",
      resourceType: "Annotation",
      resourceId: annotationId,
      metadata: {
        tagId: tag.id,
        label: tag.label,
      },
      ipAddress: getIpAddress(req),
    })

    if (created) {
      void track(identity.userId, "tag_created", {})
    }
    void track(identity.userId, "annotation_updated", { field: "tags" })

    return NextResponse.json({ data: tag }, { status: 201 })
  }
)
