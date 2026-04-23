import { NextRequest, NextResponse } from "next/server"

import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireRequestIdentity } from "@/lib/auth/request-identity"
import { createStorageAdapter } from "@/lib/storage"
import { logAudit } from "@/lib/audit"

async function handler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const identity = await requireRequestIdentity(request)

  const { searchParams } = new URL(request.url)
  const flavor = searchParams.get("flavor") || "original"

  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: identity.userId,
      deletedAt: null,
    },
    select: {
      id: true,
      storageKey: true,
      thumbnailKey: true,
    },
  })

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 })
  }

  const storage = createStorageAdapter()
  const key = flavor === "original" ? document.storageKey : document.thumbnailKey
  if (!key) {
    return NextResponse.json({ error: "Document asset not available" }, { status: 404 })
  }
  const signedUrl = await storage.getSignedUrl(key, 15 * 60) // 15 minutes

  await logAudit({
    userId: identity.userId,
    action: "document.download",
    resourceType: "document",
    resourceId: id,
    metadata: { flavor },
    ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
  })

  return NextResponse.json({ url: signedUrl })
}

export const GET = withErrorHandling(handler)
