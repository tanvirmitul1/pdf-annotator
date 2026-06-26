import { NextResponse } from "next/server"
import { TokenType } from "@prisma/client"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { getIpAddress } from "@/lib/request"
import { enforceRateLimit } from "@/lib/ratelimit"
import { RateLimitedError } from "@/lib/errors"
import { prisma } from "@/lib/db/prisma"
import { createUserToken, getResendCooldown } from "@/lib/tokens"
import { sendEmail } from "@/lib/email/resend"
import { verifyEmailTemplate } from "@/lib/email/templates/verify-email"
import { env } from "@/lib/env"

export const POST = withErrorHandling(async (req) => {
  // IP-level guard first — 10 requests/min max per IP
  const ip = getIpAddress(req)
  await enforceRateLimit(req, ip, "auth")

  const user = await requireUser()

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { email: true, name: true, emailVerified: true },
  })

  if (!dbUser?.email) {
    return NextResponse.json(
      { error: { code: "NO_EMAIL", message: "No email on account." } },
      { status: 400 }
    )
  }

  if (dbUser.emailVerified) {
    return NextResponse.json({ data: { alreadyVerified: true } })
  }

  // Per-user cooldown — enforced in DB, not just UI
  const cooldownSeconds = await getResendCooldown(user.id, TokenType.EMAIL_VERIFICATION)
  if (cooldownSeconds > 0) {
    throw new RateLimitedError(cooldownSeconds)
  }

  const token = await createUserToken(user.id, TokenType.EMAIL_VERIFICATION)
  const verifyUrl = `${env.APP_URL}/auth/verify-email/confirm?token=${token}`

  await sendEmail({
    to: dbUser.email,
    subject: "Verify your WorkHub email address",
    html: verifyEmailTemplate({ name: dbUser.name ?? "there", verifyUrl }),
    template: "verify_email",
    userId: user.id,
  }).catch((err: unknown) => {
    console.error("[send-verification] Email send failed:", err)
  })

  return NextResponse.json({ data: { sent: true } })
})
