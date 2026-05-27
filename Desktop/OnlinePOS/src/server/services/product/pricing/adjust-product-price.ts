import { prisma } from "@/lib/prisma";
import { assertPricingValid } from "@/lib/products/pricing";
import { NotFoundError } from "@/server/utils/errors";
import { recordPriceChanges } from "@/server/services/product/pricing/record-price-history";

export type PriceAdjustInput = {
  costPrice?: number;
  retailPrice?: number;
  wholesalePrice?: number;
  minimumPrice?: number;
  reason?: string;
};

export async function adjustProductPrice(
  businessId: string,
  productId: string,
  input: PriceAdjustInput,
  userId?: string | null,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!product) throw new NotFoundError("Product not found");
  if (product.productType === "VARIABLE") {
    throw new Error("Use variant price adjustment for variable products");
  }

  const next = {
    costPrice: input.costPrice ?? product.costPrice,
    retailPrice: input.retailPrice ?? product.price,
    wholesalePrice: input.wholesalePrice ?? product.wholesalePrice,
    minimumPrice: input.minimumPrice ?? product.minimumPrice,
  };

  assertPricingValid(next);

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id: productId },
      data: {
        costPrice: next.costPrice,
        price: next.retailPrice,
        wholesalePrice: next.wholesalePrice,
        minimumPrice: next.minimumPrice,
      },
      include: {
        categoryRef: true,
        subCategoryRef: true,
        brandRef: true,
        unitRef: true,
      },
    });

    await recordPriceChanges(
      {
        productId,
        changedBy: userId,
        reason: input.reason,
        changes: [
        {
          type: "COST_PRICE",
          oldValue: product.costPrice,
          newValue: next.costPrice,
        },
        {
          type: "RETAIL_PRICE",
          oldValue: product.price,
          newValue: next.retailPrice,
        },
        {
          type: "WHOLESALE_PRICE",
          oldValue: product.wholesalePrice,
          newValue: next.wholesalePrice,
        },
        {
          type: "MINIMUM_PRICE",
          oldValue: product.minimumPrice,
          newValue: next.minimumPrice,
        },
      ],
      },
      tx,
    );

    return p;
  });

  return updated;
}
