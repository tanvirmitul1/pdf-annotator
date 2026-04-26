import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { notificationsFor } from "@/lib/db/repositories/notifications"

/** GET /api/notifications — list notifications for the current user */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const unreadOnly = searchParams.get("unreadOnly") === "true"
  const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100)

  const result = await notificationsFor(session.user.id).list({ unreadOnly, limit })
  return NextResponse.json({ data: result })
}

/** PATCH /api/notifications — mark all as read */
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const count = await notificationsFor(session.user.id).markAllRead()
  return NextResponse.json({ data: { markedRead: count } })
}
