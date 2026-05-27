import { join } from "path";
import { COVERAGE_DOMAINS } from "@/lib/import/coverage-domains";
import { buildTableSummary, parseMysqlDump } from "@/lib/import/mysql-dump-parser";
import { prisma } from "@/lib/prisma";

export type TableCoverageRow = {
  key: string;
  label: string;
  dumpRows: number;
  appRows: number | null;
  importMode: "catalog" | "full" | "planned" | "skip";
  status: "complete" | "partial" | "empty" | "planned" | "app_only";
};

export type DomainCoverage = {
  id: string;
  title: string;
  description: string;
  status: "complete" | "partial" | "empty" | "planned";
  tables: TableCoverageRow[];
};

export type ImportCoverageSnapshot = {
  dumpFileFound: boolean;
  dumpFilePath: string | null;
  domains: DomainCoverage[];
  summary: {
    catalogComplete: boolean;
    salesComplete: boolean;
    recommendedMode: "none" | "full" | "sales_history";
    message: string;
  };
  appTotals: Record<string, number>;
};

async function resolveBundledSqlPath(): Promise<string | null> {
  const { existsSync } = await import("fs");
  for (const p of [
    join(process.cwd(), "novasori_novaosp.sql"),
    join(process.cwd(), "import-data", "novasori_novaosp.sql"),
  ]) {
    if (existsSync(p)) return p;
  }
  return null;
}

function tableStatus(
  tableKey: string,
  dumpRows: number,
  appRows: number | null,
  importMode: TableCoverageRow["importMode"],
): TableCoverageRow["status"] {
  if (importMode === "planned") {
    if (dumpRows === 0) return "empty";
    return "planned";
  }
  if (appRows == null) return dumpRows > 0 ? "partial" : "empty";
  if (dumpRows === 0 && appRows === 0) return "empty";
  if (dumpRows === 0 && appRows > 0) return "app_only";
  if (appRows >= dumpRows) return "complete";
  // Active-only sales / returns: fewer rows in app than dump is expected
  if (
    (tableKey === "sales" || tableKey === "sale_details") &&
    dumpRows > 0 &&
    appRows > 0 &&
    appRows / dumpRows >= 0.8
  ) {
    return "complete";
  }
  if (dumpRows > 0 && appRows > 0) return "partial";
  return "empty";
}

function domainStatus(tables: TableCoverageRow[]): DomainCoverage["status"] {
  const actionable = tables.filter((t) => t.importMode !== "planned");
  if (actionable.length === 0) return "planned";
  if (actionable.every((t) => t.status === "complete" || t.status === "app_only"))
    return "complete";
  if (actionable.some((t) => t.status === "partial" || t.status === "complete"))
    return "partial";
  if (actionable.every((t) => t.status === "empty")) return "empty";
  return "partial";
}

async function loadAppTotals(businessId: string): Promise<Record<string, number>> {
  const [
    categories,
    subcategories,
    brands,
    units,
    warehouses,
    products,
    variants,
    productStocks,
    customers,
    legacyUsers,
    cashRegisters,
    orders,
    orderItems,
    saleReturns,
    saleReturnLines,
    expenses,
    suppliers,
    stockHistory,
  ] = await Promise.all([
    prisma.productCategory.count({ where: { businessId, oldId: { not: null } } }),
    prisma.productSubCategory.count({ where: { businessId, oldId: { not: null } } }),
    prisma.productBrand.count({ where: { businessId, oldId: { not: null } } }),
    prisma.productUnit.count({ where: { businessId, oldId: { not: null } } }),
    prisma.warehouse.count({ where: { businessId } }),
    prisma.product.count({ where: { businessId, oldId: { not: null } } }),
    prisma.productVariant.count({ where: { product: { businessId } } }),
    prisma.productStock.count({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    }),
    prisma.customer.count({ where: { businessId, oldId: { not: null } } }),
    prisma.legacyUser.count({ where: { businessId } }),
    prisma.cashRegister.count({ where: { businessId } }),
    prisma.order.count({ where: { businessId, oldId: { not: null } } }),
    prisma.orderItem.count({ where: { order: { businessId } } }),
    prisma.saleReturn.count({ where: { businessId } }),
    prisma.saleReturnLine.count({ where: { saleReturn: { businessId } } }),
    prisma.expense.count({ where: { businessId } }),
    prisma.supplier.count({ where: { businessId } }),
    prisma.stockHistory.count({ where: { product: { businessId } } }),
  ]);

  return {
    categories,
    subcategories,
    brands,
    units,
    warehouses,
    products,
    variants,
    productStocks,
    customers,
    legacyUsers,
    cashRegisters,
    orders,
    orderItems,
    saleReturns,
    saleReturnLines,
    expenses,
    suppliers,
    stockHistory,
  };
}

export async function getImportCoverage(
  businessId: string,
  sqlOverride?: string,
): Promise<ImportCoverageSnapshot> {
  const dumpPath = await resolveBundledSqlPath();
  let dumpSummary: Record<string, { rowCount: number }> = {};

  if (sqlOverride) {
    dumpSummary = buildTableSummary(parseMysqlDump(sqlOverride));
  } else if (dumpPath) {
    const { readFileSync } = await import("fs");
    const sql = readFileSync(dumpPath, "utf8");
    dumpSummary = buildTableSummary(parseMysqlDump(sql));
  }

  const appTotals = await loadAppTotals(businessId);

  const domains: DomainCoverage[] = COVERAGE_DOMAINS.map((domain) => {
    const tables: TableCoverageRow[] = domain.tables.map((t) => {
      const dumpRows = dumpSummary[t.key]?.rowCount ?? 0;
      const appRows = t.appKey ? (appTotals[t.appKey] ?? 0) : null;
      const status = tableStatus(t.key, dumpRows, appRows, t.importMode);
      return {
        key: t.key,
        label: t.label,
        dumpRows,
        appRows,
        importMode: t.importMode,
        status,
      };
    });
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      status: domainStatus(tables),
      tables,
    };
  });

  const catalog = domains.find((d) => d.id === "catalog")!;
  const sales = domains.find((d) => d.id === "sales")!;
  const customers = domains.find((d) => d.id === "customers")!;

  const catalogComplete = catalog.status === "complete";
  const salesComplete =
    sales.status === "complete" && customers.status === "complete";

  let recommendedMode: ImportCoverageSnapshot["summary"]["recommendedMode"] =
    "none";
  let message =
    "Your legacy data is fully migrated for catalog, customers, and sales.";

  if (!catalogComplete) {
    recommendedMode = "full";
    message =
      "Run a full import to load the product catalog and stock from the SQL dump.";
  } else if (!salesComplete) {
    recommendedMode = catalogComplete ? "sales_history" : "full";
    message = catalogComplete
      ? "Catalog is done. Run sales history import (or full import) for customers and orders."
      : "Run a full import to load customers, sales, and settings.";
  }

  return {
    dumpFileFound: Boolean(sqlOverride || dumpPath),
    dumpFilePath: dumpPath,
    domains,
    appTotals,
    summary: {
      catalogComplete,
      salesComplete,
      recommendedMode,
      message,
    },
  };
}
