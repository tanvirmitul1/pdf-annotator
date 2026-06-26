import bcrypt from "bcrypt"
import { TokenType, UsageMetric } from "@prisma/client"

import { track } from "@/lib/analytics"
import { prisma } from "@/lib/db/prisma"
import { usersRepository } from "@/lib/db/repositories/users"
import { queueWelcomeEmailStub } from "@/lib/email/stub"
import { sendEmail } from "@/lib/email/resend"
import { verifyEmailTemplate } from "@/lib/email/templates/verify-email"
import { createUserToken } from "@/lib/tokens"
import { env } from "@/lib/env"
import { ConflictError } from "@/lib/errors"

export async function registerCredentialsUser(input: {
  name: string
  email: string
  password: string
}) {
  const existing = await usersRepository().findByEmail(input.email)

  if (existing) {
    throw new ConflictError("An account with that email already exists")
  }

  const passwordHash = await bcrypt.hash(input.password, 12)

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        planId: "free",
      },
    })

    await tx.usage.createMany({
      data: [
        { userId: createdUser.id, metric: UsageMetric.DOCUMENTS, value: 0 },
        { userId: createdUser.id, metric: UsageMetric.STORAGE_MB, value: 0 },
        { userId: createdUser.id, metric: UsageMetric.SHARE_LINKS, value: 0 },
        { userId: createdUser.id, metric: UsageMetric.ANNOTATIONS, value: 0 },
      ],
      skipDuplicates: true,
    })

    return createdUser
  })

  await track(user.id, "user_signed_up", { method: "credentials" })
  await queueWelcomeEmailStub(user.id)

  // Send verification email (non-blocking — don't fail signup if email fails)
  createUserToken(user.id, TokenType.EMAIL_VERIFICATION)
    .then(async (token) => {
      const verifyUrl = `${env.APP_URL}/auth/verify-email/confirm?token=${token}`
      await sendEmail({
        to: user.email!,
        subject: "Verify your WorkHub email address",
        html: verifyEmailTemplate({ name: user.name ?? "there", verifyUrl }),
        template: "verify_email",
        userId: user.id,
      })
    })
    .catch((err: unknown) => {
      console.error("[register] Failed to send verification email:", err)
    })

  return user
}

export async function provisionOAuthUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    return null
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      planId: "free",
    },
  })

  await prisma.usage.createMany({
    data: [
      { userId, metric: UsageMetric.DOCUMENTS, value: 0 },
      { userId, metric: UsageMetric.STORAGE_MB, value: 0 },
      { userId, metric: UsageMetric.SHARE_LINKS, value: 0 },
      { userId, metric: UsageMetric.ANNOTATIONS, value: 0 },
    ],
    skipDuplicates: true,
  })

  await track(userId, "user_signed_up", { method: "google" })
  await queueWelcomeEmailStub(userId)
  return user
}
