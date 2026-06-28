import { NextResponse } from "next/server"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { listUserTags } from "@/features/annotations/service"

// ─── GET /api/tags ───────────────────────────────────────────────────────────

export const GET = withErrorHandling(async () => {
  const user = await requireUser()
  const tags = await listUserTags(user.id)
  return NextResponse.json({ data: tags })
})
