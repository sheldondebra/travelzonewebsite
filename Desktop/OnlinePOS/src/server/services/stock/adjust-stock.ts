import { prisma } from "@/lib/prisma";
import { syncParentStockFromVariants } from "@/server/services/product/pricing/adjust-variant-price";
import { NotFoundError } from "@/server/utils/errors";

export async function adjustProductStock(
  businessId: string,
  productId: string,
  input: {
    quantity: number;
    warehouseId?: string | null;
    reason?: string;
  },
  userId?: string | null,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null, productType: "SIMPLE" },
  });
  if (!product) throw new NotFoundError("Simple product not found");

  const warehouseId =
    input.warehouseId ??
    (
      await prisma.warehouse.findFirst({
        where: { businessId, isDefault: true },
      })
    )?.id ??
    null;

  const oldQty = product.stockQuantity;
  const newQty = Math.max(0, Math.round(input.quantity));

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: newQty },
    });

    const stock = await tx.productStock.findFirst({
      where: { productId, variantId: null, warehouseId },
    });
    if (stock) {
      await tx.productStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });
    } else {
      await tx.productStock.create({
        data: { productId, variantId: null, warehouseId, quantity: newQty },
      });
    }

    await tx.stockHistory.create({
      data: {
        productId,
        warehouseId,
        oldQuantity: oldQty,
        newQuantity: newQty,
        quantityChanged: newQty - oldQty,
        action: "MANUAL_ADJUSTMENT",
        changedBy: userId ?? undefined,
        note: input.reason,
      },
    });

    await tx.inventoryMovement.create({
      data: {
        productId,
        businessId,
        type: "ADJUSTMENT",
        quantity: newQty - oldQty,
        note: input.reason ?? "Manual stock adjustment",
      },
    });
  });

  return { productId, stockQuantity: newQty };
}

export async function adjustVariantStock(
  businessId: string,
  variantId: string,
  input: {
    quantity: number;
    warehouseId?: string | null;
    reason?: string;
  },
  userId?: string | null,
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deletedAt: null,
      product: { businessId, deletedAt: null },
    },
  });
  if (!variant) throw new NotFoundError("Variant not found");

  const warehouseId =
    input.warehouseId ??
    (
      await prisma.warehouse.findFirst({
        where: { businessId, isDefault: true },
      })
    )?.id ??
    null;

  const oldQty = variant.stockQuantity;
  const newQty = Math.max(0, Math.round(input.quantity));

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: newQty },
    });

    const stock = await tx.productStock.findFirst({
      where: {
        productId: variant.productId,
        variantId,
        warehouseId,
      },
    });
    if (stock) {
      await tx.productStock.update({
        where: { id: stock.id },
        data: { quantity: newQty },
      });
    } else {
      await tx.productStock.create({
        data: {
          productId: variant.productId,
          variantId,
          warehouseId,
          quantity: newQty,
        },
      });
    }

    await tx.stockHistory.create({
      data: {
        productId: variant.productId,
        variantId,
        warehouseId,
        oldQuantity: oldQty,
        newQuantity: newQty,
        quantityChanged: newQty - oldQty,
        action: "MANUAL_ADJUSTMENT",
        changedBy: userId ?? undefined,
        note: input.reason,
      },
    });
  });

  await syncParentStockFromVariants(variant.productId);
  return { variantId, stockQuantity: newQty };
}

export async function getStockHistory(
  businessId: string,
  productId: string,
  variantId?: string,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });
  if (!product) throw new NotFoundError("Product not found");

  return prisma.stockHistory.findMany({
    where: { productId, ...(variantId ? { variantId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      warehouse: { select: { id: true, name: true } },
      variant: { select: { id: true, name: true } },
    },
  });
}
