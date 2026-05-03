import { prisma } from "../lib/db/prisma";

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'DocumentText';
  `);
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
