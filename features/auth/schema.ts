import { z } from "zod"

export const SignUpSchema = z.object({
  displayName: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const CredentialsSignInSchema = z.object({
  method: z.literal("credentials"),
  email: z.string().email(),
  password: z.string().min(8).max(128),
})

export const GoogleSignInSchema = z.object({
  method: z.literal("google"),
})

export const SignInSchema = z.discriminatedUnion("method", [
  CredentialsSignInSchema,
  GoogleSignInSchema,
])
