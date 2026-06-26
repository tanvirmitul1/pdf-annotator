import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcrypt"

import { withErrorHandling } from "@/lib/api/handler"
import { requireUser } from "@/lib/auth/require"
import { prisma } from "@/lib/db/prisma"

const Schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export const POST = withErrorHandling(async (req) => {
  const user = await requireUser()
  const { currentPassword, newPassword } = Schema.parse(await req.json())

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  })

  // Existing password → require current password verification
  if (dbUser?.passwordHash) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Current password is required." } },
        { status: 400 }
      )
    }
    const valid = await bcrypt.compare(currentPassword, dbUser.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "Current password is incorrect." } },
        { status: 400 }
      )
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })

  return NextResponse.json({ data: { updated: true } })
})
