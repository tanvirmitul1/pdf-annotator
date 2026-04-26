import "dotenv/config"

import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script")
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
})

async function main() {
  await prisma.plan.upsert({
    where: { id: "free" },
    update: {
      name: "Free",
      price: 0,
      limits: {
        maxDocuments: 1000,
        maxStorageMB: 10000,
        maxAnnotationsPerDoc: 5000,
        maxShareLinks: 100,
        allowedFeatures: [
          "basic-annotation",
          "pdf-viewer",
          "image-annotation",
          "tags",
          "collections",
          "share-links-basic",
        ],
      },
    },
    create: {
      id: "free",
      name: "Free",
      price: 0,
      limits: {
        maxDocuments: 1000,
        maxStorageMB: 10000,
        maxAnnotationsPerDoc: 5000,
        maxShareLinks: 100,
        allowedFeatures: [
          "basic-annotation",
          "pdf-viewer",
          "image-annotation",
          "tags",
          "collections",
          "share-links-basic",
        ],
      },
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
