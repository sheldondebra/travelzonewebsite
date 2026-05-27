import { prisma } from "@/lib/prisma";
import {
  applyFixedChange,
  applyPercentChange,
  assertPricingValid,
} from "@/lib/products/pricing";
import { recordPriceChanges } from "@/server/services/product/pricing/record-price-history";

export type BulkAdjustMethod =
  | "retail_percent_up"
  | "retail_percent_down"
  | "retail_fixed_up"
  | "retail_fixed_down"
  | "set_wholesale"
  | "set_minimum";

export async function bulkAdjustPrices(
  businessId: string,
  input: {
    productIds?: string[];
    categoryId?: string;
    brandId?: string;
    productType?: "SIMPLE" | "VARIABLE";
    method: BulkAdjustMethod;
    value: number;
    reason?: string;
  },
  userId?: string | null,
) {
  const products = await prisma.product.findMany({
    where: {
      businessId,
      deletedAt: null,
      isActive: true,
      productType: "SIMPLE",
      ...(input.productIds?.length ? { id: { in: input.productIds } } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.brandId ? { brandId: input.brandId } : {}),
      ...(input.productType ? { productType: input.productType } : {}),
    },
    include: { variants: { where: { deletedAt: null, isActive: true } } },
  });

  const preview: {
    id: string;
    name: string;
    oldRetail: number;
    newRetail: number;
  }[] = [];

  let updated = 0;

  for (const product of products) {
    if (product.productType === "VARIABLE") continue;

    const oldRetail = product.price;
    let newRetail = oldRetail;
    let newWholesale = product.wholesalePrice;
    let newMinimum = product.minimumPrice;

    switch (input.method) {
      case "retail_percent_up":
        newRetail = applyPercentChange(oldRetail, input.value);
        break;
      case "retail_percent_down":
        newRetail = applyPercentChange(oldRetail, -input.value);
        break;
      case "retail_fixed_up":
        newRetail = applyFixedChange(oldRetail, input.value);
        break;
      case "retail_fixed_down":
        newRetail = applyFixedChange(oldRetail, -input.value);
        break;
      case "set_wholesale":
        newWholesale = input.value;
        break;
      case "set_minimum":
        newMinimum = input.value;
        break;
    }

    const pricing = {
      costPrice: product.costPrice,
      retailPrice: newRetail,
      wholesalePrice: newWholesale,
      minimumPrice: newMinimum,
    };

    try {
      assertPricingValid(pricing);
    } catch {
      continue;
    }

    preview.push({
      id: product.id,
      name: product.name,
      oldRetail,
      newRetail,
    });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        price: newRetail,
        wholesalePrice: newWholesale,
        minimumPrice: newMinimum,
      },
    });

    await recordPriceChanges({
      productId: product.id,
      changedBy: userId,
      reason: input.reason ?? "Bulk price adjustment",
      changes: [
        {
          type: "RETAIL_PRICE",
          oldValue: oldRetail,
          newValue: newRetail,
        },
        ...(newWholesale !== product.wholesalePrice
          ? [
              {
                type: "WHOLESALE_PRICE" as const,
                oldValue: product.wholesalePrice,
                newValue: newWholesale,
              },
            ]
          : []),
        ...(newMinimum !== product.minimumPrice
          ? [
              {
                type: "MINIMUM_PRICE" as const,
                oldValue: product.minimumPrice,
                newValue: newMinimum,
              },
            ]
          : []),
      ],
    });

    updated++;
  }

  return { updated, preview: preview.slice(0, 50) };
}
