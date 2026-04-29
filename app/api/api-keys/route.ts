import { NextResponse } from "next/server"
import { z } from "zod"

import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { generateApiKey } from "@/lib/auth/api-keys"
import { logAudit } from "@/lib/audit"

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  expiresAt: z.coerce.date().optional(),
})

/** List all API keys for the current user (raw tokens are never returned). */
async function listHandler() {
  const user = await requireUser()

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      prefix: true,
      lastUsedAt: true,
      expiresAt: true,
      revokedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ items: keys })
}

/** Create a new API key. The raw token is returned exactly once in the response. */
async function createHandler(request: Request) {
  const user = await requireUser()
  const body = CreateApiKeySchema.parse(await request.json())
  const { raw, hash, prefix } = generateApiKey()

  const key = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: body.name,
      prefix,
      tokenHash: hash,
      expiresAt: body.expiresAt ?? null,
    },
    select: {
      id: true,
      name: true,
      prefix: true,
      expiresAt: true,
      createdAt: true,
    },
  })

  await logAudit({
    userId: user.id,
    action: "api_key.create",
    resourceType: "ApiKey",
    resourceId: key.id,
    metadata: { name: body.name, prefix },
    ipAddress: "unknown",
  })

  // Return the raw token once — it cannot be retrieved again
  return NextResponse.json({ ...key, token: raw }, { status: 201 })
}

export const GET = withErrorHandling(listHandler)
export const POST = withErrorHandling(createHandler)
