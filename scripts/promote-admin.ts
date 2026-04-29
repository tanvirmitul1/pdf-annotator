import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function promoteAdmin() {
  const email = process.argv[2]

  if (!email) {
    console.error("Usage: tsx scripts/promote-admin.ts <email>")
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      planId: true,
    },
  })

  console.log("✅ User promoted to ADMIN:")
  console.log(user)
}

promoteAdmin()
  .catch((error) => {
    console.error("❌ Error:", error.message)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
