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
  await enforceRateLimit(req, ipAddress, "auth")
  const input = SignUpSchema.parse(await req.json())
  const user = await registerCredentialsUser(input)

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
