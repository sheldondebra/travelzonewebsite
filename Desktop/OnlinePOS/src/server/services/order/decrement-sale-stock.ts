import type { Prisma } from "@/generated/prisma/client";
import { InsufficientStockError } from "@/server/utils/errors";

async function syncParentStockInTx(
  tx: Prisma.TransactionClient,
  productId: string,
) {
  const variants = await tx.productVariant.findMany({
    where: { productId, deletedAt: null, isActive: true },
  });
  const totalStock = variants.reduce((s, v) => s + v.stockQuantity, 0);
  await tx.product.update({
    where: { id: productId },
    data: { stockQuantity: totalStock },
  });
}

type SaleLine = {
  productId: string;
  productName: string;
  variantId?: string | null;
  variantName?: string | null;
  quantity: number;
};

export async function decrementStockForSale(
  tx: Prisma.TransactionClient,
  businessId: string,
  line: SaleLine,
  options?: { allowNegativeStock?: boolean },
) {
  const allowNegative = options?.allowNegativeStock ?? false;
  if (line.variantId) {
    const variant = await tx.productVariant.findFirst({
      where: {
        id: line.variantId,
        productId: line.productId,
        deletedAt: null,
        product: { businessId },
      },
    });
    if (!variant) {
      throw new InsufficientStockError(line.productName, 0, line.quantity);
    }
    if (!allowNegative && variant.stockQuantity < line.quantity) {
      throw new InsufficientStockError(
        `${line.productName} — ${variant.name}`,
        variant.stockQuantity,
        line.quantity,
      );
    }

    const warehouse =
      (await tx.warehouse.findFirst({
        where: { businessId, isDefault: true },
      })) ??
      (await tx.warehouse.findFirst({ where: { businessId } }));

    const newVariantQty = variant.stockQuantity - line.quantity;
    await tx.productVariant.update({
      where: { id: variant.id },
      data: { stockQuantity: newVariantQty },
    });

    if (warehouse) {
      const stock = await tx.productStock.findFirst({
        where: {
          productId: line.productId,
          variantId: variant.id,
          warehouseId: warehouse.id,
        },
      });
      if (stock) {
        await tx.productStock.update({
          where: { id: stock.id },
          data: { quantity: Math.max(0, stock.quantity - line.quantity) },
        });
      }
    }

    await tx.stockHistory.create({
      data: {
        productId: line.productId,
        variantId: variant.id,
        warehouseId: warehouse?.id,
        oldQuantity: variant.stockQuantity,
        newQuantity: newVariantQty,
        quantityChanged: -line.quantity,
        action: "SALE",
        note: "POS sale",
      },
    });

    await syncParentStockInTx(tx, line.productId);
    return;
  }

  const product = await tx.product.findFirst({
    where: { id: line.productId, businessId },
  });
  if (!product || (!allowNegative && product.stockQuantity < line.quantity)) {
    throw new InsufficientStockError(
      line.productName,
      product?.stockQuantity ?? 0,
      line.quantity,
    );
  }

  await tx.product.update({
    where: { id: line.productId },
    data: { stockQuantity: { decrement: line.quantity } },
  });

  const warehouse =
    (await tx.warehouse.findFirst({
      where: { businessId, isDefault: true },
    })) ??
    (await tx.warehouse.findFirst({ where: { businessId } }));

  if (warehouse) {
    const stock = await tx.productStock.findFirst({
      where: {
        productId: line.productId,
        variantId: null,
        warehouseId: warehouse.id,
      },
    });
    if (stock) {
      await tx.productStock.update({
        where: { id: stock.id },
        data: { quantity: Math.max(0, stock.quantity - line.quantity) },
      });
    }
  }

  await tx.stockHistory.create({
    data: {
      productId: line.productId,
      warehouseId: warehouse?.id,
      oldQuantity: product.stockQuantity,
      newQuantity: product.stockQuantity - line.quantity,
      quantityChanged: -line.quantity,
      action: "SALE",
      note: "POS sale",
    },
  });
}
