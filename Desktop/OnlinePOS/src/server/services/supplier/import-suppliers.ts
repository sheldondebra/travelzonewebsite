import { createSupplier } from "@/server/services/supplier/create-supplier";
import { z } from "zod";

export const importSuppliersSchema = z.object({
  rows: z.array(
    z.object({
      name: z.string().min(1),
      contact: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
});

export async function importSuppliers(
  businessId: string,
  input: z.infer<typeof importSuppliersSchema>,
) {
  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const row of input.rows) {
    try {
      await createSupplier(businessId, {
        name: row.name,
        contact: row.contact,
        phone: row.phone,
        email: row.email || undefined,
        notes: row.notes,
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

  return {
    imported: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  };
}
