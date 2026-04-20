import { describe, expect, it } from "vitest"

import { accountRepository } from "@/lib/db/repositories/account"
import { signUp } from "@/features/auth/service"
import {
  changePassword,
  restoreAccount,
  scheduleAccountDeletion,
  updateProfile,
} from "@/features/settings/service"
import { verifyPassword } from "@/lib/auth/password"

describe("settings flows", () => {
  it("profile update saves and persists", async () => {
    const repository = accountRepository()
    const user = repository.getUserByEmail("demo@example.com")

    expect(user).not.toBeNull()

    await updateProfile(user!.id, "Updated Demo")

    expect(repository.getUserById(user!.id)?.displayName).toBe("Updated Demo")
  })

  it("change password flow updates the stored password", async () => {
    const repository = accountRepository()
    const user = repository.getUserByEmail("demo@example.com")

    expect(user?.passwordHash).toBeTruthy()

    await changePassword(user!.id, {
      currentPassword: "Password123!",
      newPassword: "SaferPassword123!",
    })

    const updated = repository.getUserById(user!.id)
    expect(updated?.passwordHash).toBeTruthy()
    expect(verifyPassword("SaferPassword123!", updated!.passwordHash!)).toBe(true)
  })

  it("delete account sets deletedAt and restore clears it within 7 days", async () => {
    const repository = accountRepository()
    const user = repository.getUserByEmail("demo@example.com")

    const deletedUser = await scheduleAccountDeletion(user!.id, {
      method: "credentials",
      password: "Password123!",
    })

    expect(deletedUser.deletedAt).toBeTruthy()
    expect(repository.getUserById(user!.id)?.deletedAt).toBeTruthy()

    const restored = await restoreAccount(user!.id)
    expect(restored?.deletedAt).toBeNull()
  })

  it("signup records the welcome email log", async () => {
    const result = await signUp(
      {
        displayName: "Fresh Account",
        email: "fresh@example.com",
        password: "Password123!",
      },
      {
        userAgent: "Vitest",
        ipAddress: "127.0.0.1",
      }
    )

    const emailLogs = accountRepository().listEmailLogsForUser(result.user.id)
    expect(emailLogs).toHaveLength(1)
    expect(emailLogs[0]?.template).toBe("welcome")
  })
})
