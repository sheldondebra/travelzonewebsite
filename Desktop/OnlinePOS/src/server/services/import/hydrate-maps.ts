import { prisma } from "@/lib/prisma";
import type { ImportIdMaps } from "@/server/services/import/id-maps";

/** Load existing catalog + customer + order IDs by legacy old_id (does not import products). */
export async function hydrateImportMapsFromDatabase(
  businessId: string,
  maps: ImportIdMaps,
) {
  const [
    categories,
    subcategories,
    brands,
    units,
    warehouses,
    products,
    variants,
    clients,
    sales,
    users,
    cashRegisters,
    saleReturns,
  ] = await Promise.all([
    prisma.productCategory.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.productSubCategory.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.productBrand.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.productUnit.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.warehouse.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.product.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.productVariant.findMany({
      where: { product: { businessId }, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.customer.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.order.findMany({
      where: { businessId, oldId: { not: null } },
      select: { id: true, oldId: true },
    }),
    prisma.legacyUser.findMany({
      where: { businessId },
      select: { id: true, oldId: true },
    }),
    prisma.cashRegister.findMany({
      where: { businessId },
      select: { id: true, oldId: true },
    }),
    prisma.saleReturn.findMany({
      where: { businessId },
      select: { id: true, oldId: true },
    }),
  ]);

  for (const r of categories) maps.set("categories", r.oldId, r.id);
  for (const r of subcategories) maps.set("subcategories", r.oldId, r.id);
  for (const r of brands) maps.set("brands", r.oldId, r.id);
  for (const r of units) maps.set("units", r.oldId, r.id);
  for (const r of warehouses) maps.set("warehouses", r.oldId, r.id);
  for (const r of products) maps.set("products", r.oldId, r.id);
  for (const r of variants) maps.set("variants", r.oldId, r.id);
  for (const r of clients) maps.set("clients", r.oldId, r.id);
  for (const r of sales) maps.set("sales", r.oldId, r.id);
  for (const r of users) maps.set("users", r.oldId, r.id);
  for (const r of cashRegisters) maps.set("cash_registers", r.oldId, r.id);
  for (const r of saleReturns) maps.set("sale_returns", r.oldId, r.id);
}
