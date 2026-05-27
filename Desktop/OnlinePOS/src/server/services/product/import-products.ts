import {
  countGarbageProductNames,
  isGarbageProductName,
} from "@/lib/import/detect-garbage";
import { createProduct } from "@/server/services/product/create-product";
import { AppError } from "@/server/utils/errors";
import type { importProductsSchema } from "@/server/validations/product";
import type { z } from "zod";

type ImportInput = z.infer<typeof importProductsSchema>;

export async function importProducts(businessId: string, input: ImportInput) {
  const garbage = countGarbageProductNames(input.rows.map((r) => r.name));
  if (garbage > 0) {
    throw new AppError(
      garbage > input.rows.length * 0.2
        ? "This file looks like a MySQL .sql dump, not a product CSV. Use Dashboard → Products → Database import with your novasori_novaosp.sql file instead."
        : `${garbage} row(s) look like SQL dump lines, not products. Remove them from the file or use Database import for .sql.`,
      400,
    );
  }

  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const row of input.rows) {
    if (isGarbageProductName(row.name)) {
      results.push({
        name: row.name,
        ok: false,
        error: "Skipped — not a valid product name (SQL dump line?)",
      });
      continue;
    }
    try {
      await createProduct(businessId, {
        name: row.name,
        productType: "SIMPLE",
        sku: row.sku,
        barcode: row.barcode,
        price: row.price,
        costPrice: row.costPrice,
        wholesalePrice: row.wholesalePrice ?? 0,
        minimumPrice: row.minimumPrice ?? 0,
        stockQuantity: row.stockQuantity,
        stockAlert: 5,
        category: row.category,
        subCategory: row.subCategory,
        brand: row.brand,
        unit: row.unit,
      });
      results.push({ name: row.name, ok: true });
    } catch (e) {
      results.push({
        name: row.name,
        ok: false,
        error: e instanceof Error ? e.message : "Failed",
      });
    }
  }

  const imported = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  return { imported, failed, results };
}
