import { prisma } from "@/lib/db/prisma"

export function usersRepository() {
  return {
    findByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
      })
    },
    findById(id: string) {
      return prisma.user.findUnique({
        where: { id },
      })
    },
    create(input: {
      name: string
      email: string
      passwordHash?: string | null
      image?: string | null
    }) {
      return prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          image: input.image ?? null,
          passwordHash: input.passwordHash ?? null,
          planId: "free",
        },
      })
    },
  }
}
