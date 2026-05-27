import { isGarbageProductName } from "@/lib/import/detect-garbage";
import { prisma } from "@/lib/prisma";

/** Remove invalid catalog rows (SQL/translation lines imported as CSV). */
export async function purgeGarbageProducts(businessId: string) {
  const byQuery = await prisma.product.deleteMany({
    where: {
      businessId,
      OR: [
        { name: { startsWith: "(" } },
        { name: { startsWith: "INSERT INTO", mode: "insensitive" } },
        { name: { startsWith: "CREATE TABLE", mode: "insensitive" } },
        { name: { startsWith: "--" } },
      ],
    },
  });

  const remaining = await prisma.product.findMany({
    where: { businessId },
    select: { id: true, name: true },
  });
  const extraIds = remaining
    .filter((p) => isGarbageProductName(p.name))
    .map((p) => p.id);

  if (extraIds.length > 0) {
    await prisma.product.deleteMany({
      where: { businessId, id: { in: extraIds } },
    });
  }

  return { removed: byQuery.count + extraIds.length };
}

/** Delete entire catalog for one tenant (keeps business & app users). */
export async function deleteAllTenantProducts(businessId: string) {
  let removed = 0;
  await prisma.$transaction(async (tx) => {
    await tx.orderItem.deleteMany({ where: { order: { businessId } } });
    await tx.order.deleteMany({ where: { businessId } });
    await tx.saleReturnLine.deleteMany({ where: { saleReturn: { businessId } } });
    await tx.saleReturn.deleteMany({ where: { businessId } });
    await tx.stockHistory.deleteMany({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    });
    await tx.productStock.deleteMany({
      where: {
        OR: [
          { product: { businessId } },
          { variant: { product: { businessId } } },
        ],
      },
    });
    await tx.productVariant.deleteMany({ where: { product: { businessId } } });
    const result = await tx.product.deleteMany({ where: { businessId } });
    removed = result.count;
  });
  return { removed };
}
