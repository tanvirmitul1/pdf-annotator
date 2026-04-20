import { ConflictError, ForbiddenError, NotFoundError, UnauthenticatedError } from "@/lib/errors"
import { queueTransactionalEmail } from "@/lib/email"
import { accountRepository } from "@/lib/db/repositories/account"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { describeSession } from "@/lib/auth/session"
import { track } from "@/lib/analytics"

export async function signUp(
  input: { displayName: string; email: string; password: string },
  meta: { userAgent: string; ipAddress: string }
) {
  const repository = accountRepository()
  const existingUser = repository.getUserByEmail(input.email)

  if (existingUser) {
    throw new ConflictError("An account with that email already exists")
  }

  const user = repository.createUser({
    email: input.email,
    displayName: input.displayName,
    passwordHash: hashPassword(input.password),
    providers: ["credentials"],
    emailVerified: true,
  })

  const session = repository.createSession({
    userId: user.id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    label: describeSession(meta.userAgent),
  })

  repository.createAuditLog({
    userId: user.id,
    action: "signup",
    resourceType: "User",
    resourceId: user.id,
    metadata: { method: "credentials" },
    ipAddress: meta.ipAddress,
  })

  track(user.id, "user_signed_up", { method: "credentials" })

  await queueTransactionalEmail({
    userId: user.id,
    to: user.email,
    template: "welcome",
    props: {
      name: user.displayName,
      actionUrl: "/app",
    },
  })

  return { user, session }
}

export async function signIn(
  input: { method: "credentials"; email: string; password: string } | { method: "google" },
  meta: { userAgent: string; ipAddress: string }
) {
  const repository = accountRepository()

  if (input.method === "google") {
    const user = repository.getUserByEmail("google-user@example.com")

    if (!user) {
      throw new NotFoundError("Google demo account")
    }

    const session = repository.createSession({
      userId: user.id,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      label: describeSession(meta.userAgent),
    })

    track(user.id, "user_signed_in", { method: "google" })

    return { user, session }
  }

  const user = repository.getUserByEmail(input.email)

  if (!user || !user.passwordHash) {
    throw new UnauthenticatedError()
  }

  if (!verifyPassword(input.password, user.passwordHash)) {
    throw new UnauthenticatedError()
  }

  const session = repository.createSession({
    userId: user.id,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    label: describeSession(meta.userAgent),
  })

  track(user.id, "user_signed_in", { method: "credentials" })

  return { user, session }
}

export async function signOut(sessionId: string | null) {
  if (!sessionId) {
    return
  }

  const repository = accountRepository()
  const session = repository.getSessionById(sessionId)

  if (!session) {
    return
  }

  repository.revokeSession(session.userId, session.id)
  track(session.userId, "user_signed_out", {})
}

export async function requireCredentialsUser(userId: string) {
  const repository = accountRepository()
  const user = repository.getUserById(userId)

  if (!user) {
    throw new NotFoundError("User")
  }

  if (!user.providers.includes("credentials")) {
    throw new ForbiddenError("This account does not use password sign-in")
  }

  return user
}
