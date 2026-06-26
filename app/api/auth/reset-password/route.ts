import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcrypt"
import { TokenType } from "@prisma/client"

import { withErrorHandling } from "@/lib/api/handler"
import { consumeUserToken } from "@/lib/tokens"
import { prisma } from "@/lib/db/prisma"

const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const POST = withErrorHandling(async (req) => {
  const { token, password } = Schema.parse(await req.json())

  const userId = await consumeUserToken(token, TokenType.PASSWORD_RESET)

  if (!userId) {
    return NextResponse.json(
      { error: { code: "INVALID_TOKEN", message: "This reset link is invalid or has expired." } },
      { status: 400 }
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  })

  return NextResponse.json({ data: { reset: true } })
})
