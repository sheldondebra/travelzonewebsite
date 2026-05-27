/**
 * Seed Novasori catalog from legacy MySQL dump.
 *
 * Usage:
 *   npm run db:import-novasori
 *   npm run db:import-novasori -- --force-update
 *
 * Env: DATABASE_URL, DIRECT_URL (for advisory locks if needed elsewhere)
 */
import "dotenv/config";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { prisma } from "../src/lib/prisma";
import {
  createImportSessionFromFile,
  DEFAULT_IMPORT_RUN_OPTIONS,
  runDatabaseImport,
  type ImportRunOptions,
} from "../src/server/services/import/run-import";

const NOVASORI_BUSINESS_ID = "cmpgfvbkp000000y6hxmxj7y0";

const SQL_CANDIDATES = [
  join(process.cwd(), "novasori_novaosp.sql"),
  join(process.cwd(), "import-data", "novasori_novaosp.sql"),
  join(process.cwd(), "..", "novasori_novaosp.sql"),
];

function resolveSqlPath(): string {
  for (const p of SQL_CANDIDATES) {
    if (existsSync(p)) return resolve(p);
  }
  throw new Error(
    `SQL dump not found. Place it at import-data/novasori_novaosp.sql or Desktop/novasori_novaosp.sql`,
  );
}

async function main() {
  const forceUpdate = process.argv.includes("--force-update");

  const options: ImportRunOptions = {
    ...DEFAULT_IMPORT_RUN_OPTIONS,
    mode: "full",
    updateExisting: forceUpdate ? true : DEFAULT_IMPORT_RUN_OPTIONS.updateExisting,
    skipDuplicates: forceUpdate ? false : DEFAULT_IMPORT_RUN_OPTIONS.skipDuplicates,
  };

  const sqlPath = resolveSqlPath();
  console.log(`SQL dump: ${sqlPath}`);

  const business = await prisma.business.findUnique({
    where: { id: NOVASORI_BUSINESS_ID },
    select: { id: true, name: true, slug: true },
  });

  if (!business) {
    throw new Error(
      `Business ${NOVASORI_BUSINESS_ID} not found. Create Novasori tenant first.`,
    );
  }

  console.log(`Importing into: ${business.name} (${business.slug})`);

  const session = await createImportSessionFromFile(
    business.id,
    sqlPath,
    "novasori_novaosp.sql",
  );

  console.log(`Import session: ${session.id}`);
  console.log("Running full import (catalog → customers → sales)…");

  const result = await runDatabaseImport(business.id, session.id, options);

  console.log("\nImport complete:");
  console.log(JSON.stringify(result, null, 2));

  const counts = await prisma.product.groupBy({
    by: ["productType"],
    where: { businessId: business.id },
    _count: true,
  });

  console.log("\nProduct counts by type:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
