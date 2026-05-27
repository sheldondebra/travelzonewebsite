/**
 * Reset Novasori tenant data and run a full legacy import from novasori_novaosp.sql.
 *
 * Usage:
 *   npm run db:reset-import-novasori
 *   npm run db:reset-import-novasori -- --yes   # skip confirmation prompt
 *
 * Verifies legacy totals after import (e.g. total sales ≈ GHS 53,605.00).
 */
import "dotenv/config";
import { existsSync } from "fs";
import { join, resolve } from "path";
import { readFileSync } from "fs";
import { parseMysqlDump } from "../src/lib/import/mysql-dump-parser";
import { getTableRows, filterActiveRows } from "../src/server/services/import/import-helpers";
import { toNumber } from "../src/lib/import/mysql-values";
import { prisma } from "../src/lib/prisma";
import { resetTenantImportData } from "../src/server/services/import/reset-tenant-data";
import {
  createImportSessionFromFile,
  runDatabaseImport,
  type ImportRunOptions,
} from "../src/server/services/import/run-import";
import { purgeGarbageProducts } from "../src/server/services/product/purge-garbage-products";

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
    "Place novasori_novaosp.sql in the project root or import-data/",
  );
}

function expectedLegacyTotals(sqlPath: string) {
  const parsed = parseMysqlDump(readFileSync(sqlPath, "utf8"));
  const sales = filterActiveRows(getTableRows(parsed.inserts.sales));
  const details = getTableRows(parsed.inserts.sale_details);
  let grandTotal = 0;
  for (const s of sales) grandTotal += toNumber(s.GrandTotal);
  let lineTotal = 0;
  for (const d of details) lineTotal += toNumber(d.total);
  return {
    activeSales: sales.length,
    grandTotal,
    lineTotal,
    products: getTableRows(parsed.inserts.products).length,
    variants: getTableRows(parsed.inserts.product_variants).length,
    clients: filterActiveRows(getTableRows(parsed.inserts.clients)).length,
  };
}

async function main() {
  const skipConfirm = process.argv.includes("--yes");
  const sqlPath = resolveSqlPath();
  const expected = expectedLegacyTotals(sqlPath);

  const business = await prisma.business.findUnique({
    where: { id: NOVASORI_BUSINESS_ID },
    select: { id: true, name: true, slug: true },
  });
  if (!business) {
    throw new Error(`Business ${NOVASORI_BUSINESS_ID} not found. Run db:seed first.`);
  }

  console.log("=== Novasori full reset + import ===");
  console.log(`Tenant: ${business.name}`);
  console.log(`SQL: ${sqlPath}`);
  console.log("Expected from dump (active sales):", expected);

  if (!skipConfirm) {
    console.log(
      "\nThis DELETES all products, customers, orders, and import data for this tenant.",
    );
    console.log("Re-run with --yes to proceed.\n");
    if (!process.env.CI) {
      throw new Error("Pass --yes to confirm reset and import");
    }
  }

  console.log("\n1/3 Resetting tenant data…");
  await resetTenantImportData(business.id);
  console.log("   Done.");

  const options: ImportRunOptions = {
    mode: "full",
    updateExisting: true,
    skipDuplicates: false,
    stopOnError: false,
  };

  console.log("\n2/3 Running full import…");
  const session = await createImportSessionFromFile(
    business.id,
    sqlPath,
    "novasori_novaosp.sql",
  );
  const result = await runDatabaseImport(business.id, session.id, options);
  console.log("   Import stats:", JSON.stringify(result, null, 2));

  console.log("\n3/3 Cleaning stray rows & verifying…");
  const purged = await purgeGarbageProducts(business.id);
  const deletedNoOldId = await prisma.product.deleteMany({
    where: { businessId: business.id, oldId: null },
  });
  if (purged.removed > 0 || deletedNoOldId.count > 0) {
    console.log("   Removed:", {
      garbageNames: purged.removed,
      noLegacyId: deletedNoOldId.count,
    });
  }

  const [
    productCount,
    variantCount,
    orderAgg,
    garbageCount,
    clientCount,
  ] = await Promise.all([
    prisma.product.count({
      where: { businessId: business.id, oldId: { not: null }, deletedAt: null },
    }),
    prisma.productVariant.count({
      where: { product: { businessId: business.id }, deletedAt: null },
    }),
    prisma.order.aggregate({
      where: { businessId: business.id },
      _sum: { totalAmount: true, profit: true, amountPaid: true },
      _count: true,
    }),
    prisma.product.count({
      where: {
        businessId: business.id,
        OR: [
          { name: { startsWith: "(" } },
          { name: { contains: "INSERT INTO" } },
        ],
      },
    }),
    prisma.customer.count({
      where: { businessId: business.id, oldId: { not: null } },
    }),
  ]);

  const revenue = orderAgg._sum.totalAmount ?? 0;
  const profit = orderAgg._sum.profit ?? 0;
  const paid = orderAgg._sum.amountPaid ?? 0;

  console.log({
    products: productCount,
    variants: variantCount,
    clients: clientCount,
    orders: orderAgg._count,
    revenue,
    grossProfit: profit,
    amountPaid: paid,
    garbageProducts: garbageCount,
  });

  const revenueOk = Math.abs(revenue - expected.grandTotal) < 0.02;
  if (!revenueOk) {
    console.warn(
      `WARNING: Revenue ${revenue} != legacy GrandTotal ${expected.grandTotal}`,
    );
  } else {
    console.log(
      `OK: Total sales (GrandTotal) matches legacy GHS ${expected.grandTotal.toFixed(2)}`,
    );
  }

  if (garbageCount > 0) {
    console.warn(`WARNING: ${garbageCount} garbage product rows remain`);
  }

  const badNames = await prisma.product.findMany({
    where: {
      businessId: business.id,
      name: { startsWith: "(" },
    },
    take: 3,
    select: { name: true },
  });
  if (badNames.length > 0) {
    console.warn("Sample garbage names:", badNames);
  }

  console.log("\nLegacy note: GHS 53,605.00 is total sales (sum of active sale GrandTotal),");
  console.log("not gross margin. Gross profit (revenue − cost) ≈", profit.toFixed(2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
