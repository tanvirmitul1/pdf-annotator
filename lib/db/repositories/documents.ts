import { prisma } from "@/lib/db/prisma"

export function documentsFor(userId: string) {
  return {
    list: () =>
      prisma.document.findMany({
        where: {
          deletedAt: null,
          OR: [{ userId }, { members: { some: { userId } } }],
        },
        select: {
          id: true,
          name: true,
          userId: true,
          lastOpenedAt: true,
        },
      }),
    get: (id: string) =>
      prisma.document.findFirst({
        where: {
          id,
          deletedAt: null,
          OR: [{ userId }, { members: { some: { userId } } }],
        },
        select: {
          id: true,
          name: true,
          userId: true,
        },
      }),
    exists: (id: string) =>
      prisma.document.findFirst({
        where: {
          id,
          deletedAt: null,
          OR: [{ userId }, { members: { some: { userId } } }],
        },
        select: {
          id: true,
          userId: true,
        },
      }),
  }
}
