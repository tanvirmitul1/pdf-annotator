import { prisma } from "@/lib/db/prisma"
import { ForbiddenError } from "@/lib/errors"
import { requireUser } from "./require"

export async function requireAdmin() {
  const user = await requireUser()
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })
  if (dbUser?.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required")
  }
  return user
}
