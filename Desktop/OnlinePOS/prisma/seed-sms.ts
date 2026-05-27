import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  seedDefaultSmsPackages,
  seedDefaultSmsTemplates,
} from "../src/server/services/sms/sms-service";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Prisma client in sms-service uses @/lib/prisma singleton — re-export for script:
// sms-service imports global prisma; ensure same DB by setting env only.

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const force = process.argv.includes("--force");

  const [packages,] = await Promise.all([
    seedDefaultSmsPackages({ force }),
    seedDefaultSmsTemplates(),
  ]);

  const rows = await prisma.smsPackage.findMany({
    orderBy: { sortOrder: "asc" },
    select: { name: true, smsCount: true, price: true, currency: true, isActive: true },
  });

  console.log("SMS package seed:", packages);
  console.log("Active packages:");
  for (const row of rows) {
    console.log(
      `  - ${row.name}: ${row.smsCount} units @ ${row.currency} ${row.price} (${row.isActive ? "active" : "inactive"})`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
