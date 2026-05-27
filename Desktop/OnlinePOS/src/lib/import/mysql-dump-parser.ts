import { normalizeMysqlValue } from "@/lib/import/mysql-values";

export type TableInsertData = {
  columns: string[] | null;
  rows: unknown[][];
};

export type ParsedMysqlDump = {
  tables: string[];
  inserts: Record<string, TableInsertData>;
};

/** Tables shown in the database import UI (legacy product migration). */
export const IMPORT_UI_TABLES = [
  "categories",
  "subcategories",
  "brands",
  "units",
  "warehouses",
  "products",
  "product_variants",
  "product_warehouse",
] as const;

export const REQUIRED_IMPORT_TABLES = [
  "categories",
  "subcategories",
  "brands",
  "units",
  "warehouses",
  "products",
  "product_variants",
  "product_warehouse",
] as const;

export const OPTIONAL_IMPORT_TABLES = [
  "settings",
  "pos_settings",
  "currencies",
  "clients",
  "providers",
] as const;

/** Imported when mode is `full` (customer & sales history). */
export const FULL_IMPORT_TABLES = [
  "settings",
  "currencies",
  "pos_settings",
  "payment_methods",
  "clients",
  "users",
  "cash_registers",
  "sales",
  "sale_details",
  "payment_sales",
  "sale_returns",
  "sale_return_details",
  "adjustments",
  "adjustment_details",
] as const;

/** Sales history only — does not re-import catalog tables. */
export const SALES_HISTORY_IMPORT_TABLES = [
  "clients",
  "users",
  "cash_registers",
  "sales",
  "sale_details",
  "payment_sales",
  "sale_returns",
  "sale_return_details",
] as const;

/** Legacy tables with no importer yet — stored in business.settings.legacy only. */
export const DEFERRED_LEGACY_TABLES = [
  "providers",
  "purchases",
  "purchase_details",
  "payment_purchases",
  "expenses",
  "expense_categories",
  "count_stock",
  "damages",
  "damage_details",
  "transfers",
  "transfer_details",
  "draft_sales",
  "draft_sale_details",
] as const;

function parseColumnList(raw: string): string[] {
  return raw
    .split(",")
    .map((c) => c.trim().replace(/^[`'"]|[`'"]$/g, ""))
    .filter(Boolean);
}

/** Parse value tuples starting at index; returns tuples and end position. */
function parseValueTuples(
  sql: string,
  start: number,
): { tuples: unknown[][]; endIndex: number } {
  const tuples: unknown[][] = [];
  let i = start;

  while (i < sql.length) {
    while (i < sql.length && /[\s,]/.test(sql[i]!)) i++;
    if (i >= sql.length || sql[i] === ";") break;
    if (sql[i] !== "(") break;

    const tuple = parseOneTuple(sql, i);
    if (!tuple) break;
    tuples.push(tuple.values);
    i = tuple.endIndex;
  }

  return { tuples, endIndex: i };
}

function parseOneTuple(
  sql: string,
  start: number,
): { values: unknown[]; endIndex: number } | null {
  if (sql[start] !== "(") return null;
  let i = start + 1;
  const values: unknown[] = [];
  let cell = "";
  let inString: "'" | '"' | null = null;
  let depth = 1;

  while (i < sql.length && depth > 0) {
    const ch = sql[i]!;

    if (inString) {
      if (ch === "\\" && i + 1 < sql.length) {
        cell += ch + sql[i + 1];
        i += 2;
        continue;
      }
      if (ch === inString) {
        inString = null;
        cell += ch;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === "'" || ch === '"') {
      inString = ch;
      cell += ch;
      i++;
      continue;
    }

    if (ch === "(") {
      depth++;
      cell += ch;
      i++;
      continue;
    }

    if (ch === ")") {
      depth--;
      if (depth === 0) {
        if (cell.trim()) values.push(normalizeMysqlValue(cell));
        return { values, endIndex: i + 1 };
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === "," && depth === 1) {
      values.push(normalizeMysqlValue(cell));
      cell = "";
      i++;
      continue;
    }

    cell += ch;
    i++;
  }

  return null;
}

export function parseMysqlDump(sql: string): ParsedMysqlDump {
  const cleaned = sql
    .replace(/\/\*![\s\S]*?\*\//g, "")
    .replace(/--[^\n]*/g, "");

  const inserts: Record<string, TableInsertData> = {};
  const tables = new Set<string>();

  const insertRegex =
    /INSERT\s+INTO\s+[`']?(\w+)[`']?(?:\s*\(([^)]+)\))?\s*VALUES\s*/gi;

  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(cleaned)) !== null) {
    const table = match[1]!.toLowerCase();
    tables.add(table);
    const columns = match[2] ? parseColumnList(match[2]) : null;
    const valuesStart = match.index + match[0].length;
    const { tuples, endIndex } = parseValueTuples(cleaned, valuesStart);

    if (!inserts[table]) {
      inserts[table] = { columns, rows: [] };
    } else if (columns && !inserts[table].columns) {
      inserts[table].columns = columns;
    }
    inserts[table].rows.push(...tuples);
    insertRegex.lastIndex = endIndex;
  }

  const createRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+[`']?(\w+)[`']?/gi;
  let cm: RegExpExecArray | null;
  while ((cm = createRegex.exec(cleaned)) !== null) {
    tables.add(cm[1]!.toLowerCase());
  }

  return {
    tables: [...tables].sort(),
    inserts,
  };
}

export function buildTableSummary(parsed: ParsedMysqlDump) {
  const summary: Record<
    string,
    { rowCount: number; columns: string[] | null; warnings: string[] }
  > = {};

  for (const [table, data] of Object.entries(parsed.inserts)) {
    summary[table] = {
      rowCount: data.rows.length,
      columns: data.columns,
      warnings: data.rows.length === 0 ? ["No rows in INSERT statements"] : [],
    };
  }

  for (const req of REQUIRED_IMPORT_TABLES) {
    if (!summary[req]) {
      summary[req] = {
        rowCount: 0,
        columns: null,
        warnings: [`Table "${req}" not found in dump`],
      };
    }
  }

  for (const t of FULL_IMPORT_TABLES) {
    if (!summary[t]) {
      summary[t] = {
        rowCount: 0,
        columns: null,
        warnings: [`Table "${t}" not found — full import will skip this data`],
      };
    }
  }

  return summary;
}
