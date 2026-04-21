import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"
import { NotFoundError } from "@/lib/errors"
import type { SearchMatch } from "@/features/viewer/store"

const SearchSchema = z.object({
  q: z.string().min(1).max(500),
})

async function getHandler(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await requireUser()

  const doc = await prisma.document.findFirst({
    where: { id, userId: user.id, deletedAt: null },
    select: { id: true },
  })
  if (!doc) throw new NotFoundError("Document")

  const url = new URL(req.url)
  const { q } = SearchSchema.parse({ q: url.searchParams.get("q") })

  // Search DocumentText rows (pre-extracted text, never re-parse PDF)
  const textPages = await prisma.documentText.findMany({
    where: { documentId: id },
    select: { pageNumber: true, text: true },
    orderBy: { pageNumber: "asc" },
  })

  const queryLower = q.toLowerCase()
  const matches: SearchMatch[] = []

  for (const page of textPages) {
    if (!page.text) continue
    const textLower = page.text.toLowerCase()
    let start = 0
    let matchIndex = 0
    while ((start = textLower.indexOf(queryLower, start)) !== -1) {
      matches.push({
        pageNumber: page.pageNumber,
        matchIndex,
        text: page.text.slice(start, start + q.length),
        startOffset: start,
        endOffset: start + q.length,
      })
      matchIndex++
      start += q.length
    }
  }

  return NextResponse.json({ data: matches })
}

export const GET = withErrorHandling(getHandler)
