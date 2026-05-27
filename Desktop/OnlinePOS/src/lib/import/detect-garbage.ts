/** True when a name looks like a SQL dump line, not a product title. */
export function isGarbageProductName(name: string): boolean {
  const t = name.trim();
  if (!t || t.length < 2) return true;
  if (/^[\(\[]\d+\)?$/.test(t)) return true;
  if (/^\(\d+/.test(t)) return true;
  if (/^INSERT\s+INTO/i.test(t)) return true;
  if (/^CREATE\s+TABLE/i.test(t)) return true;
  if (/^--/.test(t)) return true;
  if (/^`/.test(t)) return true;
  if (/ENGINE\s*=\s*InnoDB/i.test(t)) return true;
  if (/Dumping data for table/i.test(t)) return true;
  if (/^--\s*-{3,}/.test(t)) return true;
  if (/^--\s+Table structure/i.test(t)) return true;
  if (/^--\s+--------------------------------------------------------/.test(t)) return true;
  return false;
}

/** Detect phpMyAdmin / MySQL dump text (not a product CSV). */
export function looksLikeSqlDump(text: string): boolean {
  const head = text.slice(0, 12_000);
  let score = 0;
  if (/INSERT\s+INTO\s+[`']?\w+[`']?/i.test(head)) score++;
  if (/CREATE\s+TABLE\s+[`']?\w+[`']?/i.test(head)) score++;
  if (/phpMyAdmin|MySQL dump|START TRANSACTION/i.test(head)) score++;
  if (/VALUES\s*\(/i.test(head)) score++;
  return score >= 2;
}

export function countGarbageProductNames(names: string[]): number {
  return names.filter((n) => isGarbageProductName(n)).length;
}
