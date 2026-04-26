import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { commentsFor } from "@/lib/db/repositories/comments"

const reactionSchema = z.object({
  emoji: z.string().min(1).max(10),
})

/** POST /api/comments/[id]/reactions — toggle a reaction emoji */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: commentId } = await params
  const body = await req.json()
  const parsed = reactionSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const reactions = await commentsFor(session.user.id).toggleReaction(
    commentId,
    parsed.data.emoji
  )

  return NextResponse.json({ data: reactions })
}
