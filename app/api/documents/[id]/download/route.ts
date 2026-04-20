import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { createStorageAdapter } from "@/lib/storage"
import { logAudit } from "@/lib/audit"

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await requireUser()

  const { searchParams } = new URL(request.url)
  const flavor = searchParams.get("flavor") || "original"

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

  const storage = createStorageAdapter()
  const key = `${user.id}/${id}/${flavor === "original" ? "original" : "thumb.webp"}`
  const signedUrl = await storage.getSignedUrl(key, 15 * 60) // 15 minutes

  await logAudit({
    userId: user.id,
    action: "document.download",
    resourceType: "document",
    resourceId: id,
    metadata: { flavor },
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ url: signedUrl })
}

export const GET = withErrorHandling(handler)