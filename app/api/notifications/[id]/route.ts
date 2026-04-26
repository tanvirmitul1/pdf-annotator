import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { notificationsFor } from "@/lib/db/repositories/notifications"

/** PATCH /api/notifications/[id] — mark one notification as read */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const ok = await notificationsFor(session.user.id).markRead(id)

  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ data: { success: true } })
}
