import { prisma } from "@/lib/db/prisma"

export function documentsFor(userId: string) {
  return {
    list: () =>
      prisma.document.findMany({
        where: { userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          lastOpenedAt: true,
        },
      }),
    get: (id: string) =>
      prisma.document.findFirst({
        where: { id, userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      }),
  }
}
