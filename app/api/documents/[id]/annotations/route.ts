import { NextResponse, type NextRequest } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { assertCanPerform } from "@/lib/authz/assert"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { NotFoundError } from "@/lib/errors"
import { annotationsFor } from "@/lib/db/repositories/annotations"
import { documentsFor } from "@/lib/db/repositories/documents"
import { CreateAnnotationSchema } from "@/features/annotations/schema"
import {
  createAnnotation,
  listAnnotations,
} from "@/features/annotations/service"

// ─── GET /api/documents/[id]/annotations ─────────────────────────────────────

export const GET = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: documentId } = await ctx.params
    const identity = await requireRequestIdentity(req)

    const doc = await documentsFor(identity.userId).exists(documentId)
    if (!doc) throw new NotFoundError("Document")

    const annotations = await listAnnotations(identity.userId, documentId)
    return NextResponse.json({ data: annotations })
  }
)

// ─── POST /api/documents/[id]/annotations ────────────────────────────────────

export const POST = withErrorHandling(
  async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
    const { id: documentId } = await ctx.params
    const identity = await requireRequestIdentity(req)               // 1. auth
    await enforceRateLimit(req, identity.userId, "annotation-write") // 2. rate limit
    const input = CreateAnnotationSchema.parse(await req.json())     // 3. validate

    const doc = await documentsFor(identity.userId).exists(documentId)
    if (!doc) throw new NotFoundError("Document")

    // 5. Quota check
    const currentCount = await annotationsFor(identity.userId).countByDocument(documentId)
    await assertCanPerform(identity.userId, "annotation.create", {
      currentAnnotationsPerDoc: currentCount,
    })

    // 6. Execute
    const annotation = await createAnnotation(identity.userId, documentId, input)

    // 7. Audit
    await logAudit({
      userId: identity.userId,
      action: "annotation.create",
      resourceType: "Annotation",
      resourceId: annotation.id,
      metadata: { type: annotation.type, documentId },
      ipAddress: getIpAddress(req),
    })

    // 8. Analytics
    void track(identity.userId, "annotation_created", {
      type: annotation.type,
      hasComment: Boolean(annotation.content),
      tagCount: annotation.tags.length,
    })

    // 9. Respond
    return NextResponse.json({ data: annotation }, { status: 201 })
  }
)
