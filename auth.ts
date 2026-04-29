import bcrypt from "bcrypt"
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import { z } from "zod"

import { env } from "@/lib/env"
import { prisma } from "@/lib/db/prisma"
import { usersRepository } from "@/lib/db/repositories/users"
import { provisionOAuthUser } from "@/lib/auth/register"
import { track } from "@/lib/analytics"

// Debug: Log Google OAuth config on module load (remove in production)
console.log("[Auth Config] GOOGLE_CLIENT_ID:", env.GOOGLE_CLIENT_ID ? "set" : "MISSING")
console.log("[Auth Config] GOOGLE_CLIENT_SECRET:", env.GOOGLE_CLIENT_SECRET ? "set" : "MISSING")
console.log("[Auth Config] NEXTAUTH_SECRET:", env.NEXTAUTH_SECRET ? "set" : "MISSING")
console.log("[Auth Config] AUTH_SECRET:", process.env.AUTH_SECRET ? "set" : "MISSING")
console.log("[Auth Config] AUTH_GOOGLE_ID:", process.env.AUTH_GOOGLE_ID ? "set" : "MISSING")
console.log("[Auth Config] AUTH_GOOGLE_SECRET:", process.env.AUTH_GOOGLE_SECRET ? "set" : "MISSING")
console.log("[Auth Config] Effective clientId:", (env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) ? "available" : "UNDEFINED")
console.log("[Auth Config] Effective secret:", (env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET) ? "available" : "UNDEFINED")

const CredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// How long a session JWT is valid (7 days).
const SESSION_MAX_AGE = 7 * 24 * 60 * 60
// Re-sign the JWT cookie every 1 hour so the expiry slides forward.
const SESSION_UPDATE_AGE = 60 * 60
// Hard ceiling: force re-login after 30 days regardless of activity.
const ABSOLUTE_SESSION_LIMIT = 30 * 24 * 60 * 60
// Re-fetch planId from DB at most once every 5 minutes (per JWT rotation).
const PLAN_CACHE_TTL = 5 * 60

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: SESSION_UPDATE_AGE,
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        if (!profile.email_verified) {
          throw new Error("Google account email is not verified")
        }

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        }
      },
    }),
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: String(profile.id),
          name: profile.name ?? profile.login,
          email: profile.email,
          image: profile.avatar_url,
        }
      },
    }),
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = CredentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const user = await usersRepository().findByEmail(parsed.data.email)
        if (!user?.passwordHash) {
          return null
        }

        const valid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!valid) {
          return null
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          planId: user.planId,
        }
      },
    }),
  ],
  events: {
    async createUser({ user }) {
      if (user.id) {
        await provisionOAuthUser(user.id)
      }
    },
    async signIn({ user, account }) {
      if (user.id && account?.provider) {
        await track(user.id, "user_signed_in", {
          method: account.provider === "credentials" ? "credentials" : account.provider,
        })
      }
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as { email_verified?: boolean } | undefined
        return Boolean(googleProfile?.email_verified)
      }

      return true
    },
    async jwt({ token, user, trigger }) {
      const now = Math.floor(Date.now() / 1000)

      // First sign-in: seed the token with user data
      if (user?.id) {
        token.userId = user.id
        token.planId = (user as { planId?: string }).planId ?? "free"
        token.issuedAt = now
        token.planFetchedAt = now
        return token
      }

      // Absolute session timeout — force re-login after 30 days
      const issuedAt = typeof token.issuedAt === "number" ? token.issuedAt : now
      if (now - issuedAt > ABSOLUTE_SESSION_LIMIT) {
        return {} // returning empty token causes Auth.js to clear the session
      }

      const userId = token.userId ?? token.sub
      if (typeof userId === "string") {
        token.userId = userId

        // Only re-fetch planId from DB if cache is stale or on explicit session update
        const planFetchedAt = typeof token.planFetchedAt === "number" ? token.planFetchedAt : 0
        if (trigger === "update" || now - planFetchedAt > PLAN_CACHE_TTL) {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { planId: true },
          })
          token.planId = currentUser?.planId ?? "free"
          token.planFetchedAt = now
        }
      }

      // Preserve issuedAt across rotations
      if (!token.issuedAt) {
        token.issuedAt = now
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = typeof token.userId === "string" ? token.userId : token.sub ?? ""
        session.user.planId = typeof token.planId === "string" ? token.planId : "free"
      }

      return session
    },
  },
  secret: env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
})
