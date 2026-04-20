import { addDays, differenceInCalendarDays } from "@/lib/time"
import { track } from "@/lib/analytics"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { assertCanPerform } from "@/lib/authz/assert"
import { accountRepository } from "@/lib/db/repositories/account"
import { queueTransactionalEmail } from "@/lib/email"
import { ConflictError, ForbiddenError, NotFoundError, UnauthenticatedError } from "@/lib/errors"
import { enqueueInProcessJob } from "@/lib/jobs/queue"

export async function updateProfile(userId: string, displayName: string) {
  const repository = accountRepository()
  const user = repository.updateUser(userId, { displayName })

  if (!user) {
    throw new NotFoundError("User")
  }

  track(userId, "profile_updated", {})
  return user
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string }
) {
  const repository = accountRepository()
  const user = repository.getUserById(userId)

  if (!user) {
    throw new NotFoundError("User")
  }

  if (!user.passwordHash || !user.providers.includes("credentials")) {
    throw new ForbiddenError("Password changes are only available for credentials users")
  }

  if (!verifyPassword(input.currentPassword, user.passwordHash)) {
    throw new UnauthenticatedError()
  }

  repository.updateUser(userId, { passwordHash: hashPassword(input.newPassword) })
  return repository.getUserById(userId)
}

export async function revokeSession(userId: string, sessionId: string) {
  const repository = accountRepository()
  const session = repository.revokeSession(userId, sessionId)

  if (!session) {
    throw new NotFoundError("Session")
  }

  return session
}

export async function revokeOtherSessions(userId: string, currentSessionId: string) {
  const repository = accountRepository()
  return repository.revokeOtherSessions(userId, currentSessionId)
}

export async function requestDataExport(userId: string, userEmail: string, userName: string) {
  await assertCanPerform(userId, "export.run")

  const repository = accountRepository()
  const job = repository.createExportJob(userId)
  track(userId, "data_export_requested", {})

  void enqueueInProcessJob(`export:${job.id}`, { userId, jobId: job.id }, async ({ userId, jobId }) => {
    repository.updateExportJob(userId, jobId, { status: "processing", progress: 45 })
    await new Promise((resolve) => setTimeout(resolve, 40))

    const resultUrl = `/app/settings?download=${jobId}`
    repository.updateExportJob(userId, jobId, {
      status: "ready",
      progress: 100,
      resultUrl,
    })

    await queueTransactionalEmail({
      userId,
      to: userEmail,
      template: "data-export-ready",
      props: {
        name: userName,
        actionUrl: resultUrl,
      },
    })
  })

  return job
}

export async function scheduleAccountDeletion(
  userId: string,
  input: { method: "credentials"; password: string } | { method: "google"; email: string }
) {
  const repository = accountRepository()
  const user = repository.getUserById(userId)

  if (!user) {
    throw new NotFoundError("User")
  }

  if (user.deletedAt) {
    throw new ConflictError("Your account is already in its grace period")
  }

  if (input.method === "credentials") {
    if (!user.passwordHash || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthenticatedError()
    }
  } else if (input.email.toLowerCase() !== user.email.toLowerCase()) {
    throw new UnauthenticatedError()
  }

  const updated = repository.updateUser(userId, { deletedAt: new Date().toISOString() })

  if (!updated) {
    throw new NotFoundError("User")
  }

  await queueTransactionalEmail({
    userId,
    to: updated.email,
    template: "account-deletion-confirmation",
    props: {
      name: updated.displayName,
      actionUrl: "/app/settings",
    },
  })

  return updated
}

export async function restoreAccount(userId: string) {
  const repository = accountRepository()
  const user = repository.getUserById(userId)

  if (!user || !user.deletedAt) {
    throw new NotFoundError("Deleted account")
  }

  const deletedAt = new Date(user.deletedAt)
  if (deletedAt < addDays(new Date(), -7)) {
    throw new ForbiddenError("The restore window has expired")
  }

  return repository.updateUser(userId, { deletedAt: null })
}

export function getDeletionDaysRemaining(deletedAt: string | null) {
  if (!deletedAt) {
    return 0
  }

  const remaining = 7 - differenceInCalendarDays(new Date(), new Date(deletedAt))
  return Math.max(remaining, 0)
}
