import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/db/prisma"
import { withErrorHandling } from "@/lib/api/handler"

async function getHandler() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    )
  }

  const userId = session.user.id

  const [documentCount, chatCount, serviceAccess] = await Promise.all([
    prisma.document.count({
      where: { userId, deletedAt: null },
    }),
    prisma.conversation.count({
      where: { userId, archived: false },
    }),
    prisma.userServiceAccess.findMany({
      where: { userId },
      select: { service: true, enabled: true },
    }),
  ])

  return NextResponse.json({
    documentCount,
    chatCount,
    serviceAccess,
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
      image: session.user.image ?? null,
    },
  })
}

export const GET = withErrorHandling(getHandler)
