import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { logAudit } from "@/lib/audit"
import { mainQueue } from "@/lib/jobs/queue"

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: user.id,
      deletedAt: null,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  if (document.status !== "FAILED") {
    return NextResponse.json({ error: "Document is not in a failed state" }, { status: 400 })
  }

  // Reset status and progress, then re-queue
  await prisma.document.update({
    where: { id },
    data: { status: "PROCESSING", processingProgress: 0 },
  })

  await mainQueue.add("document.postProcess", { documentId: id }, { jobId: id })

  await logAudit({
    userId: user.id,
    action: "document.reprocess",
    resourceType: "document",
    resourceId: id,
    metadata: {},
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(handler)
