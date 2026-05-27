import "dotenv/config";
import { readFileSync } from "fs";
import {
  buildTableSummary,
  DEFERRED_LEGACY_TABLES,
  FULL_IMPORT_TABLES,
  IMPORT_UI_TABLES,
  parseMysqlDump,
} from "../src/lib/import/mysql-dump-parser";
import { prisma } from "../src/lib/prisma";

const NOVASORI = "cmpgfvbkp000000y6hxmxj7y0";

async function main() {
  const sql = readFileSync("novasori_novaosp.sql", "utf8");
  const parsed = parseMysqlDump(sql);
  const summary = buildTableSummary(parsed);

  const imported = new Set([
    ...IMPORT_UI_TABLES,
    ...FULL_IMPORT_TABLES,
  ]);
  const deferred = new Set(DEFERRED_LEGACY_TABLES);

  const withData = Object.entries(summary)
    .filter(([, v]) => v.rowCount > 0)
    .sort((a, b) => b[1].rowCount - a[1].rowCount);

  console.log("\n--- Dump tables with data ---\n");
  for (const [t, v] of withData) {
    const tag = imported.has(t as never)
      ? "✓ imported"
      : deferred.has(t as never)
        ? "○ planned"
        : "· other";
    console.log(`${tag.padEnd(12)} ${t.padEnd(30)} ${String(v.rowCount).padStart(6)} rows`);
  }

  const app = {
    products: await prisma.product.count({
      where: { businessId: NOVASORI, oldId: { not: null } },
    }),
    variants: await prisma.productVariant.count({
      where: { product: { businessId: NOVASORI } },
    }),
    categories: await prisma.productCategory.count({ where: { businessId: NOVASORI } }),
    customers: await prisma.customer.count({ where: { businessId: NOVASORI } }),
    orders: await prisma.order.count({ where: { businessId: NOVASORI } }),
    legacyUsers: await prisma.legacyUser.count({ where: { businessId: NOVASORI } }),
    cashRegisters: await prisma.cashRegister.count({ where: { businessId: NOVASORI } }),
    saleReturns: await prisma.saleReturn.count({ where: { businessId: NOVASORI } }),
    expenses: await prisma.expense.count({ where: { businessId: NOVASORI } }),
    inventoryMovements: await prisma.inventoryMovement.count({
      where: { businessId: NOVASORI },
    }),
    stockHistory: await prisma.stockHistory.count({
      where: { product: { businessId: NOVASORI } },
    }),
  };

  console.log("\n--- Novasoria in app ---\n", app);

  const dumpKey = (t: string) => summary[t]?.rowCount ?? 0;
  console.log("\n--- Parity check (dump vs app) ---\n");
  const checks: [string, number, number][] = [
    ["products", dumpKey("products"), app.products],
    ["product_variants", dumpKey("product_variants"), app.variants],
    ["clients", dumpKey("clients"), app.customers],
    ["sales", dumpKey("sales"), app.orders],
    ["users", dumpKey("users"), app.legacyUsers],
    ["cash_registers", dumpKey("cash_registers"), app.cashRegisters],
    ["sale_returns", dumpKey("sale_returns"), app.saleReturns],
    ["expenses", dumpKey("expenses"), app.expenses],
    ["adjustment_details", dumpKey("adjustment_details"), app.stockHistory],
  ];
  for (const [name, dump, appCount] of checks) {
    console.log(
      `${name.padEnd(20)} dump: ${String(dump).padStart(5)}  app: ${String(appCount).padStart(5)}`,
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
