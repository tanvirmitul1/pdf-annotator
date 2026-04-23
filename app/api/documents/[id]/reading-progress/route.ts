import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { enforceRateLimit } from "@/lib/ratelimit"
import { NotFoundError } from "@/lib/errors"

const UpdateReadingProgressSchema = z.object({
  lastPage: z.number().int().min(1),
  percentComplete: z.number().min(0).max(100),
})

async function getHandler(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(_req)

  const doc = await prisma.document.findFirst({
    where: { id, userId: identity.userId, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const progress = await prisma.readingProgress.findUnique({
    where: { userId_documentId: { userId: identity.userId, documentId: id } },
  })

  return NextResponse.json({ data: progress })
}

async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const identity = await requireRequestIdentity(req)

  await enforceRateLimit(req, identity.userId, "default")

  const doc = await prisma.document.findFirst({
    where: { id, userId: identity.userId, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const input = UpdateReadingProgressSchema.parse(await req.json())

  const progress = await prisma.readingProgress.upsert({
    where: { userId_documentId: { userId: identity.userId, documentId: id } },
    create: {
      userId: identity.userId,
      documentId: id,
      lastPage: input.lastPage,
      percentComplete: input.percentComplete,
      lastReadAt: new Date(),
    },
    update: {
      lastPage: input.lastPage,
      percentComplete: input.percentComplete,
      lastReadAt: new Date(),
    },
  })

  return NextResponse.json({ data: progress })
}

export const GET = withErrorHandling(getHandler)
export const PUT = withErrorHandling(putHandler)
