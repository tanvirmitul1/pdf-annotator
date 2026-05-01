import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { NotFoundError } from "@/lib/errors"
import { logAudit } from "@/lib/audit"
import { getAccessibleDocument } from "@/lib/db/repositories/document-access"

const PageOrderSchema = z.array(
  z.object({
    originalIndex: z.number().optional(),
    type: z.enum(["original", "blank"]),
    rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
    deleted: z.boolean().optional(),
  })
)

async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(req)
  const document = await getAccessibleDocument(identity.userId, id)

  if (!document) throw new NotFoundError("Document")

  const body = await req.json()
  const pageOrder = PageOrderSchema.parse(body)

  await prisma.document.update({
    where: { id },
    data: {
      pageOrder: pageOrder as any,
    },
  })

  await logAudit({
    userId: identity.userId,
    action: "document.update_page_order",
    resourceType: "document",
    resourceId: id,
    metadata: { pageCount: pageOrder.length },
    ipAddress: req.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json({ data: { pageOrder } })
}

export const PUT = withErrorHandling(putHandler)
