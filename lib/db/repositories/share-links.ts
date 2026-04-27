import { prisma } from "@/lib/db/prisma"

export async function getActiveShareLink(documentId: string) {
  return prisma.shareLink.findFirst({
    where: { documentId, revokedAt: null },
  })
}

export async function createShareLink(documentId: string, userId: string) {
  const token = crypto.randomUUID()
  return prisma.shareLink.create({
    data: { documentId, userId, createdBy: userId, token },
  })
}

export async function revokeShareLink(id: string) {
  return prisma.shareLink.update({
    where: { id },
    data: { revokedAt: new Date() },
  })
}
