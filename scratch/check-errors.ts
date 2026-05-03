import { prisma } from "../lib/db/prisma";

async function main() {
  const errors = await prisma.errorLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  errors.forEach(err => {
    console.log(`--- ERROR: ${err.message} ---`);
    console.log(err.stack);
  });
}

main().catch(console.error);
