import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { UpdateAnnotationSchema } from "@/features/annotations/schema"
import {
  updateAnnotation,
  softDeleteAnnotation,
} from "@/features/annotations/service"

// ─── PATCH /api/annotations/[id] ─────────────────────────────────────────────

export const PATCH = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const identity = await requireRequestIdentity(req)
    await enforceRateLimit(req, identity.userId, "annotation-write")
    const input = UpdateAnnotationSchema.parse(await req.json())

    const annotation = await updateAnnotation(identity.userId, id, input)

    // Determine which field was updated for analytics
    const field = input.content !== undefined
      ? "comment"
      : input.color !== undefined
        ? "color"
        : input.status !== undefined
          ? "status"
          : input.assigneeId !== undefined
            ? "assignee"
        : "color"

    await logAudit({
      userId: identity.userId,
      action: "annotation.update",
      resourceType: "Annotation",
      resourceId: id,
      metadata: { updatedFields: Object.keys(input) },
      ipAddress: getIpAddress(req),
    })

    void track(identity.userId, "annotation_updated", { field })

    return NextResponse.json({ data: annotation })
  }
)

// ─── DELETE /api/annotations/[id] ────────────────────────────────────────────

export const DELETE = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const identity = await requireRequestIdentity(req)
    await enforceRateLimit(req, identity.userId, "annotation-write")

    const annotation = await softDeleteAnnotation(identity.userId, id)

    await logAudit({
      userId: identity.userId,
      action: "annotation.delete",
      resourceType: "Annotation",
      resourceId: id,
      metadata: { type: annotation.type },
      ipAddress: getIpAddress(req),
    })

    void track(identity.userId, "annotation_deleted", { type: annotation.type })

    return NextResponse.json({ data: annotation })
  }
)
