/**
 * Import historical sales from legacy MySQL dump (does not touch products).
 *
 * Usage:
 *   npm run db:import-sales-history
 *   npm run db:import-sales-history -- --force-update
 *
 * Tables: clients, users, cash_registers, sales, sale_details,
 * payment_sales, sale_returns, sale_return_details
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
    "SQL dump not found. Place it at import-data/novasori_novaosp.sql",
  );
}

async function main() {
  const forceUpdate = process.argv.includes("--force-update");

  const options: ImportRunOptions = {
    ...DEFAULT_IMPORT_RUN_OPTIONS,
    mode: "sales_history",
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

  const productCount = await prisma.product.count({
    where: { businessId: business.id, oldId: { not: null } },
  });
  if (productCount === 0) {
    throw new Error(
      "No products with old_id found. Run catalog import first (db:import-novasori products) before sales history.",
    );
  }

  console.log(`Tenant: ${business.name} (${business.slug})`);
  console.log(`Catalog products with old_id: ${productCount}`);
  console.log("Running sales history import (no product changes)…");

  const session = await createImportSessionFromFile(
    business.id,
    sqlPath,
    "novasori_novaosp.sql",
  );

  const result = await runDatabaseImport(business.id, session.id, options);

  console.log("\nImport complete:");
  console.log(JSON.stringify(result, null, 2));

  const [orders, clients, legacyUsers, registers, returns] = await Promise.all([
    prisma.order.count({ where: { businessId: business.id, oldId: { not: null } } }),
    prisma.customer.count({ where: { businessId: business.id, oldId: { not: null } } }),
    prisma.legacyUser.count({ where: { businessId: business.id } }),
    prisma.cashRegister.count({ where: { businessId: business.id } }),
    prisma.saleReturn.count({ where: { businessId: business.id } }),
  ]);

  console.log("\nImported totals:", {
    orders,
    clients,
    legacyUsers,
    cashRegisters: registers,
    saleReturns: returns,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
