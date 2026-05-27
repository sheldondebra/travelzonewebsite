import { createCustomer } from "@/server/services/customer/create-customer";
import type { importCustomersSchema } from "@/server/validations/customer";
import type { z } from "zod";

type ImportInput = z.infer<typeof importCustomersSchema>;

export async function importCustomers(businessId: string, input: ImportInput) {
  const results: { name: string; ok: boolean; error?: string }[] = [];

  for (const row of input.rows) {
    try {
      const tags = row.tags
        ? row.tags.split(";").map((t) => t.trim()).filter(Boolean)
        : undefined;
      await createCustomer(businessId, {
        name: row.name,
        phone: row.phone,
        email: row.email || "",
        tags,
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
