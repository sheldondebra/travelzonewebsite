import { z } from "zod";

export const importRunSchema = z.object({
  sessionId: z.string().min(1),
  mode: z
    .enum(["products_only", "products_and_stock", "full", "sales_history"])
    .default("products_and_stock"),
  updateExisting: z.boolean().default(true),
  skipDuplicates: z.boolean().default(false),
  stopOnError: z.boolean().default(false),
});

export const adjustStockSchema = z.object({
  quantity: z.number().min(0),
  warehouseId: z.string().optional().nullable(),
  reason: z.string().optional(),
});
