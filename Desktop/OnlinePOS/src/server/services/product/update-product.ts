import { prisma } from "@/lib/prisma";
import { resolveCatalogLabels } from "@/server/services/catalog/catalog-service";
import { AppError, NotFoundError } from "@/server/utils/errors";
import type { UpdateProductInput } from "@/server/validations/product";

export async function updateProduct(
  businessId: string,
  productId: string,
  input: UpdateProductInput,
) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Product not found");

  if (input.sku && input.sku !== existing.sku) {
    const dup = await prisma.product.findFirst({
      where: { businessId, sku: input.sku, id: { not: productId } },
    });
    if (dup) throw new AppError("SKU already in use", 409);
  }

  let catalogData = {};
  if (
    input.categoryId !== undefined ||
    input.subCategoryId !== undefined ||
    input.brandId !== undefined ||
    input.unitId !== undefined
  ) {
    catalogData = await resolveCatalogLabels(businessId, {
      categoryId: input.categoryId ?? existing.categoryId ?? undefined,
      subCategoryId:
        input.subCategoryId ?? existing.subCategoryId ?? undefined,
      brandId: input.brandId ?? existing.brandId ?? undefined,
      unitId: input.unitId ?? existing.unitId ?? undefined,
    });
  }

  const { variants: _v, ...rest } = input;

  return prisma.product.update({
    where: { id: productId },
    data: {
      ...rest,
      name: input.name?.trim(),
      sku: input.sku === "" ? null : input.sku?.trim(),
      barcode: input.barcode === "" ? null : input.barcode?.trim(),
      imageUrl: input.imageUrl === "" ? null : input.imageUrl,
      ...catalogData,
    },
    include: {
      categoryRef: true,
      subCategoryRef: true,
      brandRef: true,
      unitRef: true,
    },
  });
}
