import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      planId: string
    }
  }

  interface User {
    planId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    planId?: string
  }
}
