import {
  buildTableSummary,
  parseMysqlDump,
  type ParsedMysqlDump,
} from "@/lib/import/mysql-dump-parser";
import { toBigInt, toBool, toNumber } from "@/lib/import/mysql-values";
import {
  buildProductLegacyMeta,
  buildVariantLegacyMeta,
} from "@/lib/import/legacy-product-meta";
import { resolveLegacyImportImage } from "@/lib/import/legacy-image";
import { resolveProductImageOnDisk } from "@/lib/import/resolve-product-image-on-disk";
import { prisma } from "@/lib/prisma";
import { ImportIdMaps } from "@/server/services/import/id-maps";
import {
  filterActiveRows,
  getTableRows,
  isSoftDeletedRow,
  logMigration,
  makeProductSlug,
  oldIdKey,
} from "@/server/services/import/import-helpers";
import { isGarbageProductName } from "@/lib/import/detect-garbage";
import { assertImportSchemaReady } from "@/server/services/import/assert-schema";
import { hydrateImportMapsFromDatabase } from "@/server/services/import/hydrate-maps";
import {
  importLegacyAdjustments,
  importLegacyBusinessSettings,
  importLegacyCashRegisters,
  importLegacyClients,
  importLegacySales,
  importLegacySaleReturns,
  importLegacyUsers,
} from "@/server/services/import/import-legacy-data";
import { syncParentStockFromVariants } from "@/server/services/product/pricing/adjust-variant-price";
import { purgeGarbageProducts } from "@/server/services/product/purge-garbage-products";
import { NotFoundError } from "@/server/utils/errors";

export type ImportRunOptions = {
  mode: "products_only" | "products_and_stock" | "full" | "sales_history";
  updateExisting: boolean;
  skipDuplicates: boolean;
  stopOnError: boolean;
};

export const DEFAULT_IMPORT_RUN_OPTIONS: ImportRunOptions = {
  mode: "products_and_stock",
  updateExisting: true,
  skipDuplicates: false,
  stopOnError: false,
};

export async function createImportSessionFromFile(
  businessId: string,
  filePath: string,
  fileName?: string,
) {
  const { readFileSync, statSync } = await import("fs");
  const { basename } = await import("path");
  const sqlContent = readFileSync(filePath, "utf8");
  if (!sqlContent.trim()) {
    throw new Error(`SQL file is empty: ${filePath}`);
  }
  const parsed = parseMysqlDump(sqlContent);
  const name = fileName ?? basename(filePath);
  const size = statSync(filePath).size;

  return prisma.importSession.create({
    data: {
      businessId,
      fileName: name,
      fileSize: size,
      sqlContent,
      status: "ANALYZED",
      tableSummary: buildTableSummary(parsed),
    },
  });
}

type ImportStats = {
  success: number;
  failed: number;
  skipped: number;
  warnings: number;
  byTable: Record<string, { success: number; failed: number; skipped: number }>;
};

export async function runDatabaseImport(
  businessId: string,
  sessionId: string,
  options: ImportRunOptions,
  userId?: string | null,
) {
  const session = await prisma.importSession.findFirst({
    where: { id: sessionId, businessId },
  });
  if (!session) throw new NotFoundError("Import session not found");

  if (options.mode === "full" || options.mode === "sales_history") {
    await assertImportSchemaReady();
  }

  await prisma.importSession.update({
    where: { id: sessionId },
    data: { status: "RUNNING", options, progress: { step: "Parsing SQL..." } },
  });

  const parsed = parseMysqlDump(session.sqlContent);
  const maps = new ImportIdMaps();
  const stats: ImportStats = {
    success: 0,
    failed: 0,
    skipped: 0,
    warnings: 0,
    byTable: {},
  };

  const importStock =
    options.mode === "products_and_stock" || options.mode === "full";
  const importFull = options.mode === "full";
  const importSalesHistory = options.mode === "sales_history";

  const track = (
    table: string,
    status: "success" | "failed" | "skipped" | "warning",
  ) => {
    if (!stats.byTable[table]) {
      stats.byTable[table] = { success: 0, failed: 0, skipped: 0 };
    }
    if (status === "warning") {
      stats.warnings++;
      return;
    }
    stats[status]++;
    stats.byTable[table][status]++;
  };

  const onError = async (
    table: string,
    oldId: bigint | null,
    message: string,
    source?: unknown,
  ) => {
    track(table, "failed");
    await logMigration({
      businessId,
      importSessionId: sessionId,
      tableName: table,
      oldId,
      status: "FAILED",
      message,
      sourceData: source,
    });
    if (options.stopOnError) throw new Error(message);
  };

  try {
    if (importSalesHistory) {
      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Loading existing catalog maps..." } },
      });
      await hydrateImportMapsFromDatabase(businessId, maps);

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing clients..." } },
      });
      await importLegacyClients(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing legacy users..." } },
      });
      await importLegacyUsers(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing cash registers..." } },
      });
      await importLegacyCashRegisters(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing sales history..." } },
      });
      await importLegacySales(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing sale returns..." } },
      });
      await importLegacySaleReturns(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );
    } else if (importFull) {
      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing business settings..." } },
      });
      await importLegacyBusinessSettings(
        businessId,
        sessionId,
        parsed,
        track,
        onError,
      );
    }

    if (!importSalesHistory) {
      await importCategories(businessId, sessionId, parsed, maps, options, track, onError);
      await importSubcategories(businessId, sessionId, parsed, maps, options, track, onError);
      await importBrands(businessId, sessionId, parsed, maps, options, track, onError);
      await importUnits(businessId, sessionId, parsed, maps, options, track, onError);
      await importWarehouses(businessId, sessionId, parsed, maps, options, track, onError);
      await importProducts(businessId, sessionId, parsed, maps, options, track, onError);
      await importVariants(businessId, sessionId, parsed, maps, options, track, onError);

      if (importStock) {
        await importProductWarehouse(
          businessId,
          sessionId,
          parsed,
          maps,
          options,
          track,
          onError,
          userId,
        );
      }
    }

    if (importFull) {
      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing customers..." } },
      });
      await importLegacyClients(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await importLegacyUsers(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await importLegacyCashRegisters(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing sales history..." } },
      });
      await importLegacySales(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await importLegacySaleReturns(
        businessId,
        sessionId,
        parsed,
        maps,
        options,
        track,
        onError,
      );

      await prisma.importSession.update({
        where: { id: sessionId },
        data: { progress: { step: "Importing stock adjustments (history)..." } },
      });
      await importLegacyAdjustments(
        businessId,
        sessionId,
        parsed,
        maps,
        track,
        onError,
      );
    }

    await purgeGarbageProducts(businessId);
    await prisma.product.deleteMany({
      where: { businessId, oldId: null },
    });

    await prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        result: stats,
        progress: { step: "Done" },
      },
    });

    return stats;
  } catch (e) {
    await prisma.importSession.update({
      where: { id: sessionId },
      data: {
        status: "FAILED",
        result: { ...stats, error: e instanceof Error ? e.message : "Import failed" },
      },
    });
    throw e;
  }
}

async function upsertByOldId<T extends { id: string }>(params: {
  businessId: string;
  oldId: bigint;
  find: () => Promise<T | null>;
  create: () => Promise<T>;
  update: (existing: T) => Promise<T>;
  options: ImportRunOptions;
}) {
  const existing = await params.find();
  if (existing) {
    if (params.options.updateExisting) {
      return { record: await params.update(existing), skipped: false };
    }
    if (params.options.skipDuplicates) {
      return { record: existing, skipped: true };
    }
    return { record: existing, skipped: true };
  }
  return { record: await params.create(), skipped: false };
}

async function importCategories(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.categories));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "").trim();
      if (!name) throw new Error("Category name is required");

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () =>
          prisma.productCategory.findFirst({
            where: { businessId, OR: [{ oldId }, { name }] },
          }),
        create: () =>
          prisma.productCategory.create({
            data: { businessId, oldId, name },
          }),
        update: (e) =>
          prisma.productCategory.update({
            where: { id: e.id },
            data: { oldId, name },
          }),
      });

      maps.set("categories", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "categories",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("categories", skipped ? "skipped" : "success");
    } catch (e) {
      await onError(
        "categories",
        oldIdKey(row),
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}

async function importSubcategories(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.subcategories));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "").trim();
      const catOld = toBigInt(row.category_id);
      const categoryId = catOld ? maps.get("categories", catOld) : undefined;
      if (!categoryId) {
        throw new Error("Category not found for subcategory");
      }

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () =>
          prisma.productSubCategory.findFirst({
            where: { businessId, oldId },
          }),
        create: () =>
          prisma.productSubCategory.create({
            data: { businessId, oldId, name, categoryId },
          }),
        update: (e) =>
          prisma.productSubCategory.update({
            where: { id: e.id },
            data: { name, categoryId },
          }),
      });

      maps.set("subcategories", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "subcategories",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("subcategories", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("subcategories", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

async function importBrands(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.brands));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "").trim();
      const imageUrl = resolveLegacyImportImage(row.image);

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () =>
          prisma.productBrand.findFirst({
            where: { businessId, OR: [{ oldId }, { name }] },
          }),
        create: () =>
          prisma.productBrand.create({
            data: { businessId, oldId, name, imageUrl },
          }),
        update: (e) =>
          prisma.productBrand.update({
            where: { id: e.id },
            data: { name, imageUrl },
          }),
      });

      maps.set("brands", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "brands",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("brands", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("brands", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

async function importUnits(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.units));
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? row.ShortName ?? "").trim();
      const abbreviation = row.short_name
        ? String(row.short_name)
        : row.ShortName
          ? String(row.ShortName)
          : null;

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () =>
          prisma.productUnit.findFirst({
            where: { businessId, OR: [{ oldId }, { name }] },
          }),
        create: () =>
          prisma.productUnit.create({
            data: { businessId, oldId, name, abbreviation },
          }),
        update: (e) =>
          prisma.productUnit.update({
            where: { id: e.id },
            data: { oldId, name, abbreviation },
          }),
      });

      maps.set("units", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "units",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("units", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("units", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

async function importWarehouses(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.warehouses));
  let first = true;

  if (rows.length === 0) {
    const wh = await prisma.warehouse.upsert({
      where: {
        businessId_name: { businessId, name: "Main warehouse" },
      },
      create: { businessId, name: "Main warehouse", isDefault: true },
      update: {},
    });
    maps.set("warehouses", BigInt(1), wh.id);
    return;
  }

  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "Warehouse").trim();
      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () => prisma.warehouse.findFirst({ where: { businessId, oldId } }),
        create: () =>
          prisma.warehouse.create({
            data: {
              businessId,
              oldId,
              name,
              phone: row.phone
                ? String(row.phone)
                : row.mobile
                  ? String(row.mobile)
                  : null,
              country: row.country ? String(row.country) : null,
              city: row.city ? String(row.city) : null,
              email: row.email ? String(row.email) : null,
              zip: row.zip ? String(row.zip) : null,
              isDefault: first,
            },
          }),
        update: (e) =>
          prisma.warehouse.update({
            where: { id: e.id },
            data: { name },
          }),
      });
      first = false;
      maps.set("warehouses", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "warehouses",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("warehouses", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("warehouses", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

async function importProducts(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const allRows = getTableRows(parsed.inserts.products);
  const rows =
    options.mode === "full"
      ? allRows
      : filterActiveRows(allRows);
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const name = String(row.name ?? "").trim();
      if (!name) throw new Error("Product name is required");
      if (isGarbageProductName(name)) {
        track("products", "skipped");
        continue;
      }

      const typeStr = String(row.type ?? "").toLowerCase();
      const isVariant =
        typeStr === "is_variant" ||
        typeStr === "variable" ||
        toBool(row.is_variant);
      const productType = isVariant ? "VARIABLE" : "SIMPLE";

      const categoryId = maps.get("categories", toBigInt(row.category_id));
      const subCategoryId = maps.get(
        "subcategories",
        toBigInt(row.sub_category_id ?? row.subcategory_id),
      );
      const brandId = maps.get("brands", toBigInt(row.brand_id));
      const unitId = maps.get("units", toBigInt(row.unit_id));

      const category = categoryId
        ? await prisma.productCategory.findUnique({ where: { id: categoryId } })
        : null;

      const data = {
        businessId,
        oldId,
        name,
        slug: await makeProductSlug(businessId, name),
        sku: row.code ? String(row.code) : null,
        barcode:
          row.Type_barcode && String(row.Type_barcode) !== "CODE128"
            ? String(row.Type_barcode)
            : row.code
              ? String(row.code)
              : null,
        legacyMeta: buildProductLegacyMeta(row),
        productType: productType as "SIMPLE" | "VARIABLE",
        costPrice: isVariant ? 0 : toNumber(row.cost),
        price: isVariant ? 0 : toNumber(row.price),
        wholesalePrice: isVariant ? 0 : toNumber(row.wholesale_price),
        minimumPrice: isVariant ? 0 : toNumber(row.min_price),
        stockQuantity: 0,
        stockAlert: Math.round(toNumber(row.stock_alert, 5)),
        isActive:
          isSoftDeletedRow(row)
            ? false
            : row.is_active != null
              ? toBool(row.is_active)
              : true,
        isPublic:
          row.hide_from_online_store != null
            ? !toBool(row.hide_from_online_store)
            : true,
        deletedAt: isSoftDeletedRow(row)
          ? new Date(String(row.deleted_at))
          : undefined,
        imageUrl: resolveProductImageOnDisk(row.image),
        categoryId: categoryId ?? undefined,
        subCategoryId: subCategoryId ?? undefined,
        brandId: brandId ?? undefined,
        unitId: unitId ?? undefined,
        category: category?.name,
      };

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () => prisma.product.findFirst({ where: { businessId, oldId } }),
        create: () => prisma.product.create({ data }),
        update: (e) => prisma.product.update({ where: { id: e.id }, data }),
      });

      maps.set("products", oldId, record.id);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "products",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("products", skipped ? "skipped" : "success");
    } catch (e) {
      await onError("products", oldId, e instanceof Error ? e.message : "Failed", row);
    }
  }
}

async function importVariants(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (t: string, id: bigint | null, m: string, s?: unknown) => Promise<void>,
) {
  const allRows = getTableRows(parsed.inserts.product_variants);
  const rows =
    options.mode === "full" ? allRows : filterActiveRows(allRows);
  for (const row of rows) {
    const oldId = oldIdKey(row);
    if (!oldId) continue;
    try {
      const productId = maps.get("products", toBigInt(row.product_id));
      if (!productId) throw new Error("Parent product not found");

      const name = String(row.name ?? "").trim();
      const data = {
        productId,
        oldId,
        name,
        sku: row.code ? String(row.code) : null,
        imageUrl: resolveProductImageOnDisk(row.image),
        costPrice: toNumber(row.cost),
        retailPrice: toNumber(row.price),
        wholesalePrice: toNumber(row.wholesale ?? row.wholesale_price),
        minimumPrice: toNumber(row.min_price),
        stockQuantity: Math.round(toNumber(row.qty)),
        legacyMeta: buildVariantLegacyMeta(row),
      };

      const { record, skipped } = await upsertByOldId({
        businessId,
        oldId,
        options,
        find: () =>
          prisma.productVariant.findFirst({
            where: { productId, oldId },
          }),
        create: () => prisma.productVariant.create({ data }),
        update: (e) => prisma.productVariant.update({ where: { id: e.id }, data }),
      });

      maps.set("variants", oldId, record.id);
      await syncParentStockFromVariants(productId);
      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "product_variants",
        oldId,
        newId: record.id,
        status: skipped ? "SKIPPED" : "SUCCESS",
      });
      track("product_variants", skipped ? "skipped" : "success");
    } catch (e) {
      await onError(
        "product_variants",
        oldId,
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}

async function importProductWarehouse(
  businessId: string,
  sessionId: string,
  parsed: ParsedMysqlDump,
  maps: ImportIdMaps,
  options: ImportRunOptions,
  track: (t: string, s: "success" | "failed" | "skipped") => void,
  onError: (
    t: string,
    id: bigint | null,
    m: string,
    s?: unknown,
  ) => Promise<void>,
  userId?: string | null,
) {
  const rows = filterActiveRows(getTableRows(parsed.inserts.product_warehouse));
  const defaultWh =
    (await prisma.warehouse.findFirst({
      where: { businessId, isDefault: true },
    })) ??
    (await prisma.warehouse.findFirst({ where: { businessId } }));

  for (const row of rows) {
    const oldId = oldIdKey(row);
    try {
      const productId = maps.get("products", toBigInt(row.product_id));
      if (!productId) throw new Error("Product not found for stock row");

      const variantRaw = row.product_variant_id;
      const variantOld =
        variantRaw != null && variantRaw !== "" && Number(variantRaw) !== 0
          ? toBigInt(variantRaw)
          : null;
      const variantId = variantOld ? maps.get("variants", variantOld) : null;
      const warehouseOld = toBigInt(row.warehouse_id);
      const warehouseId =
        (warehouseOld ? maps.get("warehouses", warehouseOld) : null) ??
        defaultWh?.id ??
        null;

      const qty = toNumber(row.qte ?? row.quantity);
      const manageStock = row.manage_stock != null ? toBool(row.manage_stock) : true;

      const existing = await prisma.productStock.findFirst({
        where: { productId, variantId: variantId ?? null, warehouseId },
      });

      const prevQty = existing?.quantity ?? 0;

      if (existing) {
        if (!options.updateExisting && options.skipDuplicates) {
          track("product_warehouse", "skipped");
          continue;
        }
        await prisma.productStock.update({
          where: { id: existing.id },
          data: { quantity: qty, manageStock },
        });
      } else {
        await prisma.productStock.create({
          data: {
            productId,
            variantId,
            warehouseId,
            quantity: qty,
            manageStock,
          },
        });
      }

      if (variantId) {
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { stockQuantity: Math.round(qty) },
        });
        await syncParentStockFromVariants(productId);
      } else {
        await prisma.product.update({
          where: { id: productId },
          data: { stockQuantity: Math.round(qty) },
        });
      }

      if (!existing || prevQty !== qty) {
        await prisma.stockHistory.create({
          data: {
            productId,
            variantId,
            warehouseId,
            oldQuantity: prevQty,
            newQuantity: qty,
            quantityChanged: qty - prevQty,
            action: "IMPORT",
            changedBy: userId ?? undefined,
            note: "Imported from legacy database",
          },
        });
      }

      await logMigration({
        businessId,
        importSessionId: sessionId,
        tableName: "product_warehouse",
        oldId,
        newId: productId,
        status: "SUCCESS",
      });
      track("product_warehouse", "success");
    } catch (e) {
      await onError(
        "product_warehouse",
        oldId,
        e instanceof Error ? e.message : "Failed",
        row,
      );
    }
  }
}

export async function analyzeImportSession(sessionId: string, businessId: string) {
  const session = await prisma.importSession.findFirst({
    where: { id: sessionId, businessId },
  });
  if (!session) throw new NotFoundError("Import session not found");

  const parsed = parseMysqlDump(session.sqlContent);
  const tableSummary = buildTableSummary(parsed);

  await prisma.importSession.update({
    where: { id: sessionId },
    data: { status: "ANALYZED", tableSummary },
  });

  return { parsed: { tables: parsed.tables }, tableSummary: buildTableSummary(parsed) };
}
