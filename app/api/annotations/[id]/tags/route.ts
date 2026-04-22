import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
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
    const user = await requireUser()
    await enforceRateLimit(req, user.id, "annotation-write")
    const { label } = AddTagSchema.parse(await req.json())

    const { created, tag } = await addTagToAnnotation(user.id, annotationId, label)

    await logAudit({
      userId: user.id,
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
      void track(user.id, "tag_created", {})
    }
    void track(user.id, "annotation_updated", { field: "tags" })

    return NextResponse.json({ data: tag }, { status: 201 })
  }
)
