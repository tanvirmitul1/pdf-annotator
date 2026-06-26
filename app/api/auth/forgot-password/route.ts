import { NextResponse } from "next/server"
import { z } from "zod"
import { TokenType } from "@prisma/client"

import { withErrorHandling } from "@/lib/api/handler"
import { getIpAddress } from "@/lib/request"
import { enforceRateLimit } from "@/lib/ratelimit"
import { prisma } from "@/lib/db/prisma"
import { createUserToken, getResendCooldown } from "@/lib/tokens"
import { sendEmail } from "@/lib/email/resend"
import { resetPasswordTemplate } from "@/lib/email/templates/reset-password"
import { env } from "@/lib/env"

const Schema = z.object({ email: z.string().email() })

export const POST = withErrorHandling(async (req) => {
  const ipAddress = getIpAddress(req)
  await enforceRateLimit(req, ipAddress, "auth")

  const { email } = Schema.parse(await req.json())

  // Always respond success to prevent user enumeration
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  })

  if (user?.email) {
    // Silently skip if within cooldown — don't reveal timing to caller (anti-enumeration)
    const cooldown = await getResendCooldown(user.id, TokenType.PASSWORD_RESET)
    if (cooldown > 0) {
      return NextResponse.json({ data: { sent: true } })
    }

    const token = await createUserToken(user.id, TokenType.PASSWORD_RESET)
    const resetUrl = `${env.APP_URL}/auth/reset-password?token=${token}`

    await sendEmail({
      to: user.email,
      subject: "Reset your WorkHub password",
      html: resetPasswordTemplate({ name: user.name ?? "there", resetUrl }),
      template: "reset_password",
      userId: user.id,
    }).catch(() => {
      // Don't leak send errors — still return success to caller
    })
  }

  return NextResponse.json({ data: { sent: true } })
})
