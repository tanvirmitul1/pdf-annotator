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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
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
    async jwt({ token, user }) {
      if (user?.id) {
        token.userId = user.id
      }

      const userId = token.userId ?? token.sub
      if (typeof userId === "string") {
        const currentUser = await prisma.user.findUnique({
          where: { id: userId },
          select: { planId: true },
        })

        token.userId = userId
        token.planId = currentUser?.planId ?? "free"
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
