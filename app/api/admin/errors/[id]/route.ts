import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireAdmin } from "@/lib/auth/require-admin"
import { logAudit } from "@/lib/audit"
import { NotFoundError } from "@/lib/errors"

const ResolveErrorSchema = z.object({
  resolved: z.boolean(),
  resolvedNotes: z.string().optional(),
})

async function getHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const error = await prisma.errorLog.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      resolver: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  if (!error) {
    throw new NotFoundError("Error log")
  }

  return NextResponse.json(error)
}

async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  const { id } = await params
  const body = await request.json()
  const data = ResolveErrorSchema.parse(body)

  const error = await prisma.errorLog.update({
    where: { id },
    data: {
      resolved: data.resolved,
      resolvedBy: data.resolved ? admin.id : null,
      resolvedAt: data.resolved ? new Date() : null,
      resolvedNotes: data.resolvedNotes,
    },
    select: {
      id: true,
      message: true,
      resolved: true,
    },
  })

  await logAudit({
    userId: admin.id,
    action: data.resolved ? "admin.error.resolve" : "admin.error.unresolve",
    resourceType: "ErrorLog",
    resourceId: id,
    metadata: { notes: data.resolvedNotes },
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  })

  return NextResponse.json(error)
}

export const GET = withErrorHandling(getHandler)
export const PATCH = withErrorHandling(patchHandler)
