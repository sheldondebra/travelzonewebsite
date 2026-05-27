import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function applyOpeningStock(
  businessId: string,
  items: { productId: string; quantity: number }[],
) {
  return prisma.$transaction(async (tx) => {
    const updated = [];
    for (const item of items) {
      if (item.quantity <= 0) continue;

      const product = await tx.product.findFirst({
        where: { id: item.productId, businessId },
      });
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);

      const delta = item.quantity - product.stockQuantity;
      if (delta === 0) continue;

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: item.quantity },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          businessId,
          type: "STOCK_ADDED",
          quantity: Math.abs(delta),
          note:
            delta > 0
              ? "Opening stock"
              : "Opening stock adjustment",
        },
      });

      updated.push(product.id);
    }
    return { updated: updated.length };
  });
}

export async function applyStockCount(
  businessId: string,
  items: { productId: string; countedQuantity: number }[],
) {
  return prisma.$transaction(async (tx) => {
    let adjusted = 0;
    for (const item of items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, businessId },
      });
      if (!product) continue;

      const delta = item.countedQuantity - product.stockQuantity;
      if (delta === 0) continue;

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: item.countedQuantity },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: product.id,
          businessId,
          type: delta > 0 ? "STOCK_ADDED" : "STOCK_REMOVED",
          quantity: Math.abs(delta),
          note: "Stock count adjustment",
        },
      });
      adjusted += 1;
    }
    return { adjusted };
  });
}
