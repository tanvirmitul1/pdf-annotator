import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth/require"
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
  const user = await requireUser()

  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const progress = await prisma.readingProgress.findUnique({
    where: { userId_documentId: { userId: user.id, documentId: id } },
  })

  return NextResponse.json({ data: progress })
}

async function putHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  await enforceRateLimit(req, user.id, "default")

  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const input = UpdateReadingProgressSchema.parse(await req.json())

  const progress = await prisma.readingProgress.upsert({
    where: { userId_documentId: { userId: user.id, documentId: id } },
    create: {
      userId: user.id,
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
