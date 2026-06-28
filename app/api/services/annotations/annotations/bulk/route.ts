import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { assertCanPerform } from "@/lib/authz/assert"
import { logAudit } from "@/lib/audit"
import { track } from "@/lib/analytics"
import { getIpAddress } from "@/lib/request"
import { NotFoundError } from "@/lib/errors"
import { prisma } from "@/lib/db/prisma"
import { annotationsFor } from "@/lib/db/repositories/annotations"
import { documentsFor } from "@/lib/db/repositories/documents"
import { CreateAnnotationSchema } from "@/features/annotations/schema"
import type { Prisma } from "@prisma/client"

// ─── Bulk create schema ──────────────────────────────────────────────────────

const BulkCreateSchema = z.object({
  documentId: z.string().uuid(),
  annotations: z.array(CreateAnnotationSchema).min(1).max(50), // Max 50 per batch
})

// ─── POST /api/annotations/bulk ──────────────────────────────────────────────

export const POST = withErrorHandling(
  async (req: NextRequest) => {
    const identity = await requireRequestIdentity(req)
    
    // Rate limit per batch (not per annotation)
    await enforceRateLimit(req, identity.userId, "annotation-write")
    
    const body = await req.json()
    const { documentId, annotations } = BulkCreateSchema.parse(body)

    if (annotations.length === 0) {
      return NextResponse.json(
        { error: "At least one annotation required" },
        { status: 400 }
      )
    }

    // Verify document access once (not per annotation)
    const doc = await documentsFor(identity.userId).exists(documentId)
    if (!doc) throw new NotFoundError("Document")

    // Quota check once for the batch
    const currentCount = await annotationsFor(identity.userId).countByDocument(documentId)
    await assertCanPerform(identity.userId, "annotation.create", {
      currentAnnotationsPerDoc: currentCount + annotations.length,
    })

    // Bulk upsert in single transaction
    const results = await prisma.$transaction(async (tx) => {
      const created = []

      for (const input of annotations) {
        let annotation
        
        // If clientId exists, try to find existing annotation
        if (input.clientId) {
          annotation = await tx.annotation.findUnique({
            where: { clientId: input.clientId },
            select: { id: true, clientId: true },
          })
          
          // If found, return existing (idempotent)
          if (annotation) {
            created.push({
              id: annotation.id,
              clientId: annotation.clientId,
              status: "existing" as const,
            })
            continue
          }
        }
        
        // Create new annotation
        annotation = await tx.annotation.create({
          data: {
            clientId: input.clientId,
            userId: identity.userId,
            documentId,
            pageNumber: input.pageNumber,
            type: input.type,
            status: input.status ?? "OPEN",
            assigneeId: input.assigneeId ?? null,
            color: input.color,
            positionData: input.positionData as Prisma.InputJsonValue,
            content: input.content ?? null,
          },
          select: {
            id: true,
            clientId: true,
          },
        })

        created.push({
          id: annotation.id,
          clientId: annotation.clientId,
          status: "created" as const,
        })
      }

      return created
    })

    // Audit log (batch)
    await logAudit({
      userId: identity.userId,
      action: "annotation.bulk_create",
      resourceType: "Annotation",
      resourceId: results[0]?.id,
      metadata: { 
        count: results.length,
        documentId,
      },
      ipAddress: getIpAddress(req),
    })

    // Analytics (batch) - track first annotation type
    if (results.length > 0) {
      void track(identity.userId, "annotation_created", {
        type: annotations[0].type,
        hasComment: Boolean(annotations[0].content),
        tagCount: 0,
      })
    }

    // Optimized response - only essential fields
    return NextResponse.json({ 
      data: results,
      count: results.length,
    }, { status: 201 })
  }
)
