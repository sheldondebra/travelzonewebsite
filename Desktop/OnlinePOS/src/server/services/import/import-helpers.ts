import type { TableInsertData } from "@/lib/import/mysql-dump-parser";
import { rowToObject, toBigInt } from "@/lib/import/mysql-values";
import { uniqueSlug } from "@/lib/slug";
import { prisma } from "@/lib/prisma";

export function getTableRows(
  data: TableInsertData | undefined,
): Record<string, unknown>[] {
  if (!data?.columns?.length) return [];
  return data.rows.map((row) => rowToObject(data.columns!, row));
}

export async function logMigration(params: {
  businessId: string;
  importSessionId: string;
  tableName: string;
  oldId?: bigint | null;
  newId?: string | null;
  status: "SUCCESS" | "FAILED" | "SKIPPED" | "WARNING";
  message?: string;
  sourceData?: unknown;
}) {
  await prisma.migrationLog.create({
    data: {
      businessId: params.businessId,
      importSessionId: params.importSessionId,
      tableName: params.tableName,
      oldId: params.oldId ?? undefined,
      newId: params.newId ?? undefined,
      status: params.status,
      message: params.message,
      sourceData: params.sourceData
        ? (params.sourceData as object)
        : undefined,
    },
  });
}

export async function makeProductSlug(
  businessId: string,
  name: string,
): Promise<string> {
  return uniqueSlug(name, async (s) => {
    const found = await prisma.product.findFirst({
      where: { businessId, slug: s },
    });
    return !!found;
  });
}

export function oldIdKey(row: Record<string, unknown>): bigint | null {
  return toBigInt(row.id ?? row.ID);
}

/** Skip phpMyAdmin rows soft-deleted in the legacy MySQL dump. */
export function isSoftDeletedRow(row: Record<string, unknown>): boolean {
  const deleted = row.deleted_at;
  if (deleted == null || deleted === "") return false;
  const s = String(deleted);
  if (s.startsWith("0000-00-00")) return false;
  return true;
}

export function filterActiveRows(
  rows: Record<string, unknown>[],
): Record<string, unknown>[] {
  return rows.filter((row) => !isSoftDeletedRow(row));
}
