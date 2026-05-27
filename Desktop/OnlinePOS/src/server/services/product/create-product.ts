import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import {
  ensureCatalogFromNames,
  resolveCatalogLabels,
} from "@/server/services/catalog/catalog-service";
import { syncParentStockFromVariants } from "@/server/services/product/pricing/adjust-variant-price";
import { AppError } from "@/server/utils/errors";
import type { CreateProductInput } from "@/server/validations/product";

export async function createProduct(
  businessId: string,
  input: CreateProductInput,
) {
  if (input.sku) {
    const dup = await prisma.product.findFirst({
      where: { businessId, sku: input.sku, deletedAt: null },
    });
    if (dup) throw new AppError("SKU already exists", 409);
  }

  const slug = await uniqueSlug(input.name, async (s) => {
    const found = await prisma.product.findFirst({
      where: { businessId, slug: s },
    });
    return !!found;
  });

  const labels = input.categoryId
    ? await resolveCatalogLabels(businessId, {
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
        brandId: input.brandId,
        unitId: input.unitId,
      })
    : await ensureCatalogFromNames(businessId, {
        category: input.category,
        subCategory: input.subCategory,
        brand: input.brand,
        unit: input.unit,
      });

  const isVariable = input.productType === "VARIABLE";
  const variants = input.variants ?? [];
  const stock = isVariable
    ? variants.reduce((s, v) => s + v.stockQuantity, 0)
    : (input.stockQuantity ?? 0);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: input.name.trim(),
        slug,
        sku: input.sku?.trim() || null,
        barcode: input.barcode?.trim() || null,
        description: input.description?.trim() || null,
        productType: input.productType ?? "SIMPLE",
        price: isVariable ? 0 : input.price,
        costPrice: isVariable ? 0 : input.costPrice,
        wholesalePrice: isVariable ? 0 : (input.wholesalePrice ?? 0),
        minimumPrice: isVariable ? 0 : (input.minimumPrice ?? 0),
        compareAtPrice: input.compareAtPrice,
        stockQuantity: stock,
        stockAlert: input.stockAlert ?? 5,
        imageUrl: input.imageUrl || null,
        isPublic: input.isPublic ?? true,
        isActive: input.isActive ?? true,
        businessId,
        ...labels,
      },
      include: {
        categoryRef: true,
        subCategoryRef: true,
        brandRef: true,
        unitRef: true,
        variants: true,
      },
    });

    if (isVariable) {
      for (const v of variants) {
        const variant = await tx.productVariant.create({
          data: {
            productId: product.id,
            name: v.name.trim(),
            sku: v.sku?.trim() || null,
            barcode: v.barcode?.trim() || null,
            costPrice: v.costPrice,
            retailPrice: v.retailPrice,
            wholesalePrice: v.wholesalePrice,
            minimumPrice: v.minimumPrice,
            stockQuantity: v.stockQuantity,
            imageUrl: v.imageUrl || null,
          },
        });
        await tx.productStock.create({
          data: {
            productId: product.id,
            variantId: variant.id,
            quantity: v.stockQuantity,
          },
        });
      }
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: stock },
      });
    } else {
      if (stock > 0) {
        await tx.productStock.create({
          data: {
            productId: product.id,
            variantId: null,
            quantity: stock,
          },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            businessId,
            type: "STOCK_ADDED",
            quantity: stock,
            note: "Opening stock",
          },
        });
      }
    }

    return tx.product.findUniqueOrThrow({
      where: { id: product.id },
      include: {
        categoryRef: true,
        subCategoryRef: true,
        brandRef: true,
        unitRef: true,
        variants: { where: { deletedAt: null }, orderBy: { name: "asc" } },
      },
    });
  });
}
