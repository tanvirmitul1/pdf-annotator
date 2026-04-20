import { NextResponse } from "next/server"
import { z } from "zod"

import { withErrorHandling } from "@/lib/api/handler"
import { getIpAddress } from "@/lib/request"
import { enforceRateLimit } from "@/lib/ratelimit"
import { registerCredentialsUser } from "@/lib/auth/register"

const SignUpSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8),
  acceptTerms: z.literal(true),
})

export const POST = withErrorHandling(async (req) => {
  const ipAddress = getIpAddress(req)
  console.log("[api/signup] POST received from", ipAddress)
  await enforceRateLimit(req, ipAddress, "auth")
  const body = await req.json()
  console.log("[api/signup] body", { ...body, password: "[redacted]" })
  const input = SignUpSchema.parse(body)
  const user = await registerCredentialsUser(input)
  console.log("[api/signup] user created", user.id, user.email)

  return NextResponse.json(
    {
      data: {
        id: user.id,
        email: user.email,
      },
    },
    { status: 201 }
  )
})
