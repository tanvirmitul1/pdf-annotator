import { NextResponse } from "next/server"

import { auth } from "@/auth"
import { withErrorHandling } from "@/lib/api/handler"

/**
 * GET /api/auth/me
 * Returns current user session info for client-side auth verification
 */
async function handler() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    )
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
  })
}

export const GET = withErrorHandling(handler)
