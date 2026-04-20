import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/db/prisma"

export async function logAudit(input: {
  userId: string
  action: string
  resourceType: string
  resourceId: string
  metadata: Record<string, unknown>
  ipAddress: string
}) {
  return prisma.auditLog.create({
    data: {
      ...input,
      metadata: input.metadata as Prisma.InputJsonValue,
    },
  })
}
