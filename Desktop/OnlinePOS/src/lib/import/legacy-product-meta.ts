import type { Prisma } from "@/generated/prisma/client";

/** Preserve legacy MySQL columns not mapped to first-class Prisma fields. */
export function buildProductLegacyMeta(
  row: Record<string, unknown>,
): Prisma.InputJsonObject {
  return {
    woocommerce_id: row.woocommerce_id ?? null,
    warranty_period: row.warranty_period ?? null,
    warranty_unit: row.warranty_unit ?? null,
    warranty_terms: row.warranty_terms ?? null,
    has_guarantee: row.has_guarantee ?? null,
    guarantee_period: row.guarantee_period ?? null,
    guarantee_unit: row.guarantee_unit ?? null,
    points: row.points ?? null,
    Type_barcode: row.Type_barcode ?? null,
    tax_method: row.tax_method ?? null,
    discount: row.discount ?? null,
    discount_method: row.discount_method ?? null,
    weight: row.weight ?? null,
    is_imei: row.is_imei ?? null,
    not_selling: row.not_selling ?? null,
    is_featured: row.is_featured ?? null,
    hide_from_online_store: row.hide_from_online_store ?? null,
    unit_sale_id: row.unit_sale_id ?? null,
    unit_purchase_id: row.unit_purchase_id ?? null,
    note: row.note ?? null,
    quickbooks_id: row.quickbooks_id ?? null,
    legacy_type: row.type ?? null,
  };
}

export function buildVariantLegacyMeta(
  row: Record<string, unknown>,
): Prisma.InputJsonObject {
  return {
    legacy_qty: row.qty ?? null,
    quickbooks_id: row.quickbooks_id ?? null,
  };
}
