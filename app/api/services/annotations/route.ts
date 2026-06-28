import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { resolveOptionalIdentityFromRequest } from "@/lib/device/identity"

const ListDocumentsSchema = z.object({
  collection: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(["name", "createdAt", "lastOpenedAt"]).default("lastOpenedAt"),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  showDeleted: z.string().optional().transform((v) => v === "true"),
})

async function handler(request: NextRequest) {
  const session = await auth()
  const identity = await resolveOptionalIdentityFromRequest(request, session?.user?.id ?? null)

  if (!identity) {
    console.log("[Documents List] No identity found, returning empty list")
    return NextResponse.json({
      items: [],
      nextCursor: null,
      hasMore: false,
    })
  }

  console.log(`[Documents List] Listing documents for userId: ${identity.userId}, isAnonymous: ${identity.isAnonymous}`)

  const { searchParams } = new URL(request.url)
  const params = ListDocumentsSchema.parse({
    collection: searchParams.get("collection") || undefined,
    tag: searchParams.get("tag") || undefined,
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || "lastOpenedAt",
    cursor: searchParams.get("cursor") || undefined,
    limit: searchParams.get("limit") || 20,
    showDeleted: searchParams.get("showDeleted") || undefined,
  })

  const where: Prisma.DocumentWhereInput = {
    userId: identity.userId,
    // Only show non-deleted documents unless explicitly requested
    deletedAt: params.showDeleted === true ? { not: null } : null,
  }

  console.log(`[Documents List] Query where clause:`, JSON.stringify(where))

  if (params.collection) {
    where.collections = {
      some: {
        collectionId: params.collection,
      },
    }
  }

  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: "insensitive" } },
      {
        textPages: {
          some: {
            text: { contains: params.search, mode: "insensitive" },
          },
        },
      },
    ]
  }

  const orderBy: Prisma.DocumentOrderByWithRelationInput[] =
    params.sort === "name"
      ? [{ name: "asc" }, { createdAt: "desc" }]
      : params.sort === "createdAt"
      ? [{ createdAt: "desc" }]
      : [{ lastOpenedAt: "desc" }, { createdAt: "desc" }] // Fallback to createdAt for new docs

  const documents = await prisma.document.findMany({
    where,
    include: {
      _count: {
        select: {
          annotations: true,
          bookmarks: true,
        },
      },
    },
    orderBy,
    take: params.limit + 1,
    ...(params.cursor && {
      cursor: { id: params.cursor },
      skip: 1,
    }),
  })

  console.log(`[Documents List] Found ${documents.length} documents`)

  const hasMore = documents.length > params.limit
  const items = hasMore ? documents.slice(0, -1) : documents
  const nextCursor = hasMore ? items[items.length - 1].id : null

  return NextResponse.json({
    items,
    nextCursor,
    hasMore,
  })
}

export const GET = withErrorHandling(handler)
