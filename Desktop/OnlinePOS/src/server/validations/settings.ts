import { z } from "zod";

export const patchSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()).optional(),
  themeColor: z.string().optional(),
  currency: z.string().optional(),
  receiptFooter: z.string().optional(),
  taxRate: z.number().min(0).max(100).optional(),
});
