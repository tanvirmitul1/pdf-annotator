import { Resend } from "resend"

import { accountRepository } from "@/lib/db/repositories/account"
import { type EmailTemplateName } from "@/lib/db/mock-db"
import { env } from "@/lib/env"
import { getEmailSubject, renderEmailTemplate } from "@/lib/email/templates"
import { enqueueInProcessJob } from "@/lib/jobs/queue"

interface EmailJobPayload {
  userId: string | null
  to: string
  template: EmailTemplateName
  props: {
    name: string
    actionUrl?: string
    actionLabel?: string
    email?: string
  }
}

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

export async function queueTransactionalEmail(payload: EmailJobPayload) {
  return enqueueInProcessJob(`email:${payload.template}:${payload.to}`, payload, async (jobPayload) => {
    const repository = accountRepository()
    const subject = getEmailSubject(jobPayload.template)
    const html = await renderEmailTemplate(jobPayload.template, jobPayload.props)
    const emailLog = repository.createEmailLog({
      userId: jobPayload.userId,
      template: jobPayload.template,
      to: jobPayload.to,
      subject,
      html,
      status: "queued",
      provider: resend ? "resend" : "in-process",
    })

    if (!resend) {
      repository.updateEmailLog(emailLog.id, {
        status: "skipped",
        error: "RESEND_API_KEY is not configured in this environment.",
      })
      return
    }

    try {
      const result = await resend.emails.send({
        from: env.EMAIL_FROM,
        to: jobPayload.to,
        subject,
        html,
      })

      repository.updateEmailLog(emailLog.id, {
        status: "sent",
        providerId: result.data?.id ?? null,
      })
    } catch (error) {
      repository.updateEmailLog(emailLog.id, {
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown email error",
      })
      throw error
    }
  })
}
