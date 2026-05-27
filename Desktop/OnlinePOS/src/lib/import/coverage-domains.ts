import {
  DEFERRED_LEGACY_TABLES,
  FULL_IMPORT_TABLES,
  IMPORT_UI_TABLES,
} from "@/lib/import/mysql-dump-parser";

export type CoverageTableKey =
  | (typeof IMPORT_UI_TABLES)[number]
  | (typeof FULL_IMPORT_TABLES)[number]
  | (typeof DEFERRED_LEGACY_TABLES)[number];

export type CoverageDomainConfig = {
  id: string;
  title: string;
  description: string;
  tables: {
    key: CoverageTableKey;
    label: string;
    /** Prisma count key returned by get-import-coverage */
    appKey?: string;
    importMode: "catalog" | "full" | "planned" | "skip";
  }[];
};

/** Human-readable migration map for the Novasori dump. */
export const COVERAGE_DOMAINS: CoverageDomainConfig[] = [
  {
    id: "catalog",
    title: "Product catalog",
    description: "Categories, brands, products, variants, and warehouse stock.",
    tables: [
      { key: "categories", label: "Categories", appKey: "categories", importMode: "catalog" },
      { key: "subcategories", label: "Subcategories", appKey: "subcategories", importMode: "catalog" },
      { key: "brands", label: "Brands", appKey: "brands", importMode: "catalog" },
      { key: "units", label: "Units", appKey: "units", importMode: "catalog" },
      { key: "warehouses", label: "Warehouses", appKey: "warehouses", importMode: "catalog" },
      { key: "products", label: "Products", appKey: "products", importMode: "catalog" },
      { key: "product_variants", label: "Variants", appKey: "variants", importMode: "catalog" },
      { key: "product_warehouse", label: "Stock rows", appKey: "productStocks", importMode: "catalog" },
    ],
  },
  {
    id: "customers",
    title: "Customers & team",
    description: "Clients, legacy staff users, and cash registers (not login accounts).",
    tables: [
      { key: "clients", label: "Customers", appKey: "customers", importMode: "full" },
      { key: "users", label: "Legacy users", appKey: "legacyUsers", importMode: "full" },
      { key: "cash_registers", label: "Cash registers", appKey: "cashRegisters", importMode: "full" },
    ],
  },
  {
    id: "sales",
    title: "Sales history",
    description:
      "Orders, line items, and payments. Active sales only (soft-deleted sales in the dump are skipped).",
    tables: [
      { key: "sales", label: "Sales", appKey: "orders", importMode: "full" },
      { key: "sale_details", label: "Line items", appKey: "orderItems", importMode: "full" },
      { key: "payment_sales", label: "Payments", importMode: "full" },
      { key: "sale_returns", label: "Returns", appKey: "saleReturns", importMode: "full" },
      { key: "sale_return_details", label: "Return lines", appKey: "saleReturnLines", importMode: "full" },
    ],
  },
  {
    id: "settings",
    title: "Store settings",
    description: "Currency, POS settings, and payment methods merged into business settings.",
    tables: [
      { key: "settings", label: "Settings", importMode: "full" },
      { key: "pos_settings", label: "POS settings", importMode: "full" },
      { key: "currencies", label: "Currencies", importMode: "full" },
      { key: "payment_methods", label: "Payment methods", importMode: "full" },
    ],
  },
  {
    id: "adjustments",
    title: "Stock adjustment history",
    description: "Legacy adjustments stored as audit history (does not change current stock).",
    tables: [
      { key: "adjustments", label: "Adjustments", importMode: "full" },
      { key: "adjustment_details", label: "Adjustment lines", appKey: "stockHistory", importMode: "full" },
    ],
  },
  {
    id: "planned",
    title: "Not imported yet",
    description: "Present in the dump with little or no data, or planned for a later release.",
    tables: [
      { key: "providers", label: "Suppliers", appKey: "suppliers", importMode: "planned" },
      { key: "purchases", label: "Purchases", importMode: "planned" },
      { key: "expenses", label: "Expenses", appKey: "expenses", importMode: "planned" },
      { key: "expense_categories", label: "Expense categories", importMode: "planned" },
      { key: "draft_sales", label: "Draft sales", importMode: "planned" },
      { key: "damages", label: "Damages", importMode: "planned" },
      { key: "transfers", label: "Transfers", importMode: "planned" },
      { key: "count_stock", label: "Stock counts", importMode: "planned" },
    ],
  },
];

export const DUMP_FILE_HINTS = [
  "novasori_novaosp.sql (project root)",
  "import-data/novasori_novaosp.sql",
] as const;
