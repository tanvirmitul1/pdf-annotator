import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { commentsFor } from "@/lib/db/repositories/comments"

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  mentions: z.array(z.string()).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: commentId } = await params
  const body = await req.json()
  const parsed = updateCommentSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const comment = await commentsFor(session.user.id).update(
    commentId,
    parsed.data.content,
    parsed.data.mentions
  )

  if (!comment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ data: comment })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: commentId } = await params
  const deleted = await commentsFor(session.user.id).softDelete(commentId)

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ data: { success: true } })
}
