import { NextResponse } from "next/server"
import { z } from "zod"
import { TokenType } from "@prisma/client"

import { withErrorHandling } from "@/lib/api/handler"
import { consumeUserToken } from "@/lib/tokens"
import { prisma } from "@/lib/db/prisma"

const Schema = z.object({ token: z.string().min(1) })

export const POST = withErrorHandling(async (req) => {
  const { token } = Schema.parse(await req.json())

  const userId = await consumeUserToken(token, TokenType.EMAIL_VERIFICATION)

  if (!userId) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This verification link is invalid or has expired." } },
      { status: 400 }
    )
  }

  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: new Date() },
  })

  return NextResponse.json({ data: { verified: true } })
})
