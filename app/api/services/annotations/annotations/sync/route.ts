import { NextResponse, type NextRequest } from "next/server"
import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { enforceRateLimit } from "@/lib/ratelimit"
import { assertCanPerform } from "@/lib/authz/assert"
import { logAudit } from "@/lib/audit"
import { getIpAddress } from "@/lib/request"
import { NotFoundError, ForbiddenError } from "@/lib/errors"
import { prisma } from "@/lib/db/prisma"
import { annotationsFor } from "@/lib/db/repositories/annotations"
import { documentsFor } from "@/lib/db/repositories/documents"
import { BulkSyncSchema } from "@/features/annotations/schema"
import type { Prisma, AnnotationType } from "@prisma/client"

export const POST = withErrorHandling(
  async (req: NextRequest) => {
    const identity = await requireRequestIdentity(req)
    
    // Rate limit for the sync operation
    await enforceRateLimit(req, identity.userId, "annotation-write")
    
    const body = await req.json()
    const { documentId, operations } = BulkSyncSchema.parse(body)

    // Verify document access
    const doc = await documentsFor(identity.userId).exists(documentId)
    if (!doc) throw new NotFoundError("Document")

    // Quota check (only for creations)
    const createCount = operations.filter(op => op.type === "create").length
    if (createCount > 0) {
      const currentCount = await annotationsFor(identity.userId).countByDocument(documentId)
      await assertCanPerform(identity.userId, "annotation.create", {
        currentAnnotationsPerDoc: currentCount + createCount,
      })
    }

    // Process all operations in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const syncResults: Record<string, unknown>[] = []

      for (const op of operations) {
        if (op.type === "create") {
          // Idempotent create
          let annotation = await tx.annotation.findUnique({
            where: { clientId: op.clientId },
            select: { id: true, clientId: true },
          })

          if (annotation) {
            syncResults.push({
              type: "create",
              clientId: op.clientId,
              serverId: annotation.id,
              status: "existing",
            })
            continue
          }

          annotation = await tx.annotation.create({
            data: {
              clientId: op.clientId,
              userId: identity.userId,
              documentId,
              pageNumber: op.payload.pageNumber,
              type: op.payload.type as AnnotationType,
              status: op.payload.status ?? "OPEN",
              assigneeId: op.payload.assigneeId ?? null,
              color: op.payload.color,
              positionData: op.payload.positionData as Prisma.InputJsonValue,
              content: op.payload.content ?? null,
            },
            select: { id: true, clientId: true },
          })

          syncResults.push({
            type: "create",
            clientId: op.clientId,
            serverId: annotation.id,
            status: "created",
          })
        } else if (op.type === "update") {
          if (op.id.startsWith("local-")) {
            syncResults.push({ type: "update", id: op.id, status: "error", error: "Unresolved local ID" })
            continue
          }
          // Update existing
          const existing = await tx.annotation.findUnique({
            where: { id: op.id },
            select: { userId: true },
          })

          if (!existing) {
             syncResults.push({ type: "update", id: op.id, status: "error", error: "Not Found" })
             continue
          }

          if (existing.userId !== identity.userId) {
            throw new ForbiddenError("Cannot update annotation owned by another user")
          }

          const updated = await tx.annotation.update({
            where: { id: op.id },
            data: {
              content: op.payload.content,
              color: op.payload.color,
              positionData: op.payload.positionData as Prisma.InputJsonValue,
              status: op.payload.status,
              assigneeId: op.payload.assigneeId,
              updatedAt: new Date(),
            },
            select: { id: true },
          })

          syncResults.push({ type: "update", id: updated.id, status: "updated" })
        } else if (op.type === "delete") {
          if (op.id.startsWith("local-")) {
            syncResults.push({ type: "delete", id: op.id, status: "error", error: "Unresolved local ID" })
            continue
          }
          // Soft delete
          const existing = await tx.annotation.findUnique({
            where: { id: op.id },
            select: { userId: true },
          })

          if (!existing) {
             syncResults.push({ type: "delete", id: op.id, status: "error", error: "Not Found" })
             continue
          }

          if (existing.userId !== identity.userId) {
            throw new ForbiddenError("Cannot delete annotation owned by another user")
          }

          await tx.annotation.update({
            where: { id: op.id },
            data: { deletedAt: new Date() },
          })

          syncResults.push({ type: "delete", id: op.id, status: "deleted" })
        } else if (op.type === "restore") {
          if (op.id.startsWith("local-")) {
            syncResults.push({ type: "restore", id: op.id, status: "error", error: "Unresolved local ID" })
            continue
          }
          // Un-delete
          const existing = await tx.annotation.findUnique({
            where: { id: op.id },
            select: { userId: true },
          })

          if (!existing) {
             syncResults.push({ type: "restore", id: op.id, status: "error", error: "Not Found" })
             continue
          }

          if (existing.userId !== identity.userId) {
            throw new ForbiddenError("Cannot restore annotation owned by another user")
          }

          const restored = await tx.annotation.update({
            where: { id: op.id },
            data: { deletedAt: null },
            include: { 
              user: {
                select: { id: true, name: true, email: true, image: true }
              },
              assignee: {
                select: { id: true, name: true, email: true, image: true }
              },
              tags: {
                include: { tag: true }
              }
            }
          })

          syncResults.push({ type: "restore", id: restored.id, status: "restored", payload: restored })
        }
      }

      return syncResults
    })

    // Audit log
    await logAudit({
      userId: identity.userId,
      action: "annotation.bulk_sync",
      resourceType: "Annotation",
      resourceId: documentId,
      metadata: { 
        count: results.length,
        opsCount: {
          create: operations.filter(o => o.type === "create").length,
          update: operations.filter(o => o.type === "update").length,
          delete: operations.filter(o => o.type === "delete").length,
          restore: operations.filter(o => o.type === "restore").length,
        }
      },
      ipAddress: getIpAddress(req),
    })

    return NextResponse.json({ 
      data: results,
      count: results.length,
    })
  }
)
