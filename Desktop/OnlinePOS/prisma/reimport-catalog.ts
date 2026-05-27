/**
 * Delete ALL products for Novasori and re-import catalog from novasori_novaosp.sql.
 *
 *   npm run db:reimport-catalog
 */
import "dotenv/config";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { prisma } from "../src/lib/prisma";
import { resetProductImageFileIndex } from "../src/lib/import/resolve-product-image-on-disk";
import { purgeGarbageProducts } from "../src/server/services/product/purge-garbage-products";
import { resetTenantImportData } from "../src/server/services/import/reset-tenant-data";
import {
  createImportSessionFromFile,
  runDatabaseImport,
  type ImportRunOptions,
} from "../src/server/services/import/run-import";

const NOVASORI_BUSINESS_ID = "cmpgfvbkp000000y6hxmxj7y0";

const SQL_CANDIDATES = [
  join(process.cwd(), "novasori_novaosp.sql"),
  join(process.cwd(), "import-data", "novasori_novaosp.sql"),
];

function resolveSqlPath(): string {
  for (const p of SQL_CANDIDATES) {
    if (existsSync(p)) return resolve(p);
  }
  throw new Error("novasori_novaosp.sql not found in project root or import-data/");
}

async function main() {
  const business = await prisma.business.findUnique({
    where: { id: NOVASORI_BUSINESS_ID },
    select: { id: true, name: true },
  });
  if (!business) throw new Error("Novasori business not found");

  const sqlPath = resolveSqlPath();
  console.log("SQL:", sqlPath);
  console.log("Tenant:", business.name);

  const before = await prisma.product.count({ where: { businessId: business.id } });
  console.log(`\n1. Deleting ${before} existing products (and related orders)…`);
  await resetTenantImportData(business.id);

  resetProductImageFileIndex();

  const options: ImportRunOptions = {
    mode: "full",
    updateExisting: true,
    skipDuplicates: false,
    stopOnError: false,
  };

  console.log("2. Full import from SQL (catalog, stock, customers, sales)…");
  const session = await createImportSessionFromFile(
    business.id,
    sqlPath,
    "novasori_novaosp.sql",
  );
  const result = await runDatabaseImport(business.id, session.id, options);
  console.log("   Import:", result.success, "ok,", result.failed, "failed");

  console.log("3. Removing any invalid rows…");
  const purged = await purgeGarbageProducts(business.id);
  const noOld = await prisma.product.deleteMany({
    where: { businessId: business.id, oldId: null },
  });

  const withImages = await prisma.product.count({
    where: {
      businessId: business.id,
      oldId: { not: null },
      imageUrl: { not: null },
    },
  });
  const total = await prisma.product.count({
    where: { businessId: business.id, oldId: { not: null } },
  });
  const garbage = await prisma.product.count({
    where: { businessId: business.id, name: { startsWith: "(" } },
  });

  console.log("\nDone:");
  console.log({
    legacyProducts: total,
    withImages,
    garbageLeft: garbage,
    purgedGarbage: purged.removed,
    deletedNoOldId: noOld.count,
  });

  const sample = await prisma.product.findMany({
    where: { businessId: business.id, oldId: { not: null } },
    take: 5,
    orderBy: { name: "asc" },
    select: { name: true, price: true, imageUrl: true, sku: true },
  });
  console.log("\nSample products:", sample);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
