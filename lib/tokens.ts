import { TokenType } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"

const TOKEN_TTL_MS: Record<TokenType, number> = {
  EMAIL_VERIFICATION: 24 * 60 * 60 * 1000, // 24 h
  PASSWORD_RESET: 60 * 60 * 1000,           //  1 h
}

// How long a user must wait before requesting another email of the same type
export const RESEND_COOLDOWN_MS = process.env.NODE_ENV === "production" ? 60_000 : 10_000

/** Returns seconds remaining in cooldown (0 means free to send). */
export async function getResendCooldown(userId: string, type: TokenType): Promise<number> {
  const recent = await prisma.userToken.findFirst({
    where: { userId, type },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  })
  if (!recent) return 0
  const remaining = RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0
}

export async function createUserToken(userId: string, type: TokenType): Promise<string> {
  // Invalidate any existing tokens of this type for the user
  await prisma.userToken.deleteMany({ where: { userId, type } })

  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "")
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS[type])

  await prisma.userToken.create({ data: { userId, token, type, expiresAt } })

  return token
}

/** Validates + marks used in one atomic step. Returns userId on success, null on failure. */
export async function consumeUserToken(token: string, type: TokenType): Promise<string | null> {
  const record = await prisma.userToken.findUnique({ where: { token } })

  if (!record) return null
  if (record.type !== type) return null
  if (record.usedAt) return null
  if (record.expiresAt < new Date()) return null

  await prisma.userToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  })

  return record.userId
}
