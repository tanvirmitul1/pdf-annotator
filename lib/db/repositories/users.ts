import { prisma } from "@/lib/db/prisma"

export function usersRepository() {
  return {
    findByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
      })
    },
    findByDeviceToken(deviceToken: string) {
      return prisma.user.findUnique({
        where: { deviceToken },
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
      deviceToken?: string | null
      lastKnownIp?: string | null
      isAnonymous?: boolean
    }) {
      return prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          image: input.image ?? null,
          passwordHash: input.passwordHash ?? null,
          deviceToken: input.deviceToken ?? null,
          lastKnownIp: input.lastKnownIp ?? null,
          isAnonymous: input.isAnonymous ?? false,
          planId: "free",
        },
      })
    },
  }
}
