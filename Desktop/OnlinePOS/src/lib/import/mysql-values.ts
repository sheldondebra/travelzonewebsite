/** Normalize a raw MySQL INSERT cell value. */
export function normalizeMysqlValue(raw: string): unknown {
  const v = raw.trim();
  if (v.toUpperCase() === "NULL") return null;
  if (/^'-?\d+(\.\d+)?'$/.test(v) || /^"-?\d+(\.\d+)?"$/.test(v)) {
    const n = Number(v.slice(1, -1));
    return Number.isNaN(n) ? null : n;
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (
    (v.startsWith("'") && v.endsWith("'")) ||
    (v.startsWith('"') && v.endsWith('"'))
  ) {
    return unescapeMysqlString(v.slice(1, -1));
  }
  return v;
}

function unescapeMysqlString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export function normalizeMysqlDate(value: unknown): Date | null {
  if (value == null) return null;
  const s = String(value);
  if (
    s.startsWith("0000-00-00") ||
    s === "" ||
    s === "NULL"
  ) {
    return null;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function rowToObject(
  columns: string[],
  values: unknown[],
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  columns.forEach((col, i) => {
    row[col] = values[i];
  });
  return row;
}

export function toBigInt(value: unknown): bigint | null {
  if (value == null || value === "") return null;
  try {
    return BigInt(String(value).split(".")[0]!);
  } catch {
    return null;
  }
}

export function toNumber(value: unknown, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = Number(value);
  return Number.isNaN(n) ? fallback : n;
}

export function toBool(value: unknown): boolean {
  if (value === true || value === 1 || value === "1") return true;
  return false;
}
