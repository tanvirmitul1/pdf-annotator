import { NextResponse } from "next/server"
import { z } from "zod"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

const Schema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or fewer")
    .trim(),
})

export const PATCH = withErrorHandling(async (req) => {
  const user = await requireUser()
  const { name } = Schema.parse(await req.json())

  await prisma.user.update({
    where: { id: user.id },
    data: { name },
  })

  return NextResponse.json({ data: { updated: true } })
})
