import { z } from "zod"

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(80),
})

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
})

export const RevokeSessionSchema = z.object({
  sessionId: z.string().uuid(),
})

export const DeleteAccountSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("credentials"),
    password: z.string().min(8).max(128),
  }),
  z.object({
    method: z.literal("google"),
    email: z.string().email(),
  }),
])
