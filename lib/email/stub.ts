import { EmailLogStatus } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"

export async function queueWelcomeEmailStub(userId: string) {
  await prisma.emailLog.create({
    data: {
      userId,
      template: "welcome",
      status: EmailLogStatus.SKIPPED,
      provider: "stub",
      error: "Welcome email queue is introduced in Phase 1.5.",
    },
  })
}
