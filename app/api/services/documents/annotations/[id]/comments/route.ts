import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { commentsFor } from "@/lib/db/repositories/comments"

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
  mentions: z.array(z.string()).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: annotationId } = await params
  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") ?? undefined
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100)

  const page = await commentsFor(session.user.id).listByAnnotation(annotationId, {
    cursor,
    limit,
  })

  return NextResponse.json({ data: page })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: annotationId } = await params
  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const { content, parentId, mentions = [] } = parsed.data

  const comment = await commentsFor(session.user.id).create(
    annotationId,
    content,
    parentId ?? null,
    mentions
  )

  return NextResponse.json({ data: comment }, { status: 201 })
}
