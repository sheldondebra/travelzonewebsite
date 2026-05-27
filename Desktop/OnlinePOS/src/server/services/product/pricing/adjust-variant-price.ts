import { prisma } from "@/lib/prisma";
import { assertPricingValid } from "@/lib/products/pricing";
import { NotFoundError } from "@/server/utils/errors";
import { recordPriceChanges } from "@/server/services/product/pricing/record-price-history";
import type { PriceAdjustInput } from "@/server/services/product/pricing/adjust-product-price";

export async function adjustVariantPrice(
  businessId: string,
  variantId: string,
  input: PriceAdjustInput,
  userId?: string | null,
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      deletedAt: null,
      product: { businessId, deletedAt: null },
    },
    include: { product: true },
  });
  if (!variant) throw new NotFoundError("Variant not found");

  const next = {
    costPrice: input.costPrice ?? variant.costPrice,
    retailPrice: input.retailPrice ?? variant.retailPrice,
    wholesalePrice: input.wholesalePrice ?? variant.wholesalePrice,
    minimumPrice: input.minimumPrice ?? variant.minimumPrice,
  };

  assertPricingValid(next);

  const updated = await prisma.$transaction(async (tx) => {
    const v = await tx.productVariant.update({
      where: { id: variantId },
      data: next,
    });

    await recordPriceChanges(
      {
        productId: variant.productId,
        variantId,
        changedBy: userId,
        reason: input.reason,
        changes: [
        {
          type: "COST_PRICE",
          oldValue: variant.costPrice,
          newValue: next.costPrice,
        },
        {
          type: "RETAIL_PRICE",
          oldValue: variant.retailPrice,
          newValue: next.retailPrice,
        },
        {
          type: "WHOLESALE_PRICE",
          oldValue: variant.wholesalePrice,
          newValue: next.wholesalePrice,
        },
        {
          type: "MINIMUM_PRICE",
          oldValue: variant.minimumPrice,
          newValue: next.minimumPrice,
        },
      ],
      },
      tx,
    );

    return v;
  });

  await syncParentStockFromVariants(variant.productId);
  return updated;
}

export async function syncParentStockFromVariants(productId: string) {
  const variants = await prisma.productVariant.findMany({
    where: { productId, deletedAt: null, isActive: true },
  });
  const totalStock = variants.reduce((s, v) => s + v.stockQuantity, 0);
  await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity: totalStock },
  });
}
