import { Resend } from "resend"
import { EmailLogStatus } from "@prisma/client"

import { env } from "@/lib/env"
import { prisma } from "@/lib/db/prisma"

const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function sendEmail({
  to,
  subject,
  html,
  template,
  userId,
}: {
  to: string
  subject: string
  html: string
  template: string
  userId: string
}) {
  if (!resendClient) {
    await prisma.emailLog.create({
      data: {
        userId,
        template,
        status: EmailLogStatus.SKIPPED,
        provider: "resend",
        error: "RESEND_API_KEY not configured",
      },
    })
    return
  }

  let providerId: string | null = null
  let sendError: string | null = null

  try {
    const { data, error } = await resendClient.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    if (error) {
      sendError = error.message
    } else {
      providerId = data?.id ?? null
    }
  } catch (err) {
    sendError = err instanceof Error ? err.message : "Unknown error"
  }

  await prisma.emailLog.create({
    data: {
      userId,
      template,
      status: sendError ? EmailLogStatus.FAILED : EmailLogStatus.SENT,
      provider: "resend",
      providerId,
      error: sendError,
    },
  })

  if (sendError) {
    throw new Error(`Failed to send email: ${sendError}`)
  }
}
