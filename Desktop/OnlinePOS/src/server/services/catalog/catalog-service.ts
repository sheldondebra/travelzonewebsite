import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/server/utils/errors";

export async function listCategories(businessId: string) {
  return prisma.productCategory.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, subCategories: true } } },
  });
}

export async function createCategory(businessId: string, name: string) {
  const trimmed = name.trim();
  return prisma.productCategory.upsert({
    where: { businessId_name: { businessId, name: trimmed } },
    create: { businessId, name: trimmed },
    update: {},
  });
}

export async function deleteCategory(businessId: string, id: string) {
  const cat = await prisma.productCategory.findFirst({
    where: { id, businessId },
  });
  if (!cat) throw new NotFoundError("Category not found");
  await prisma.product.updateMany({
    where: { categoryId: id },
    data: { categoryId: null, category: null },
  });
  return prisma.productCategory.delete({ where: { id } });
}

export async function listSubCategories(
  businessId: string,
  categoryId?: string,
) {
  return prisma.productSubCategory.findMany({
    where: {
      businessId,
      ...(categoryId ? { categoryId } : {}),
    },
    orderBy: { name: "asc" },
    include: { category: { select: { id: true, name: true } } },
  });
}

export async function createSubCategory(
  businessId: string,
  name: string,
  categoryId: string,
) {
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, businessId },
  });
  if (!category) throw new NotFoundError("Category not found");

  return prisma.productSubCategory.upsert({
    where: {
      businessId_categoryId_name: {
        businessId,
        categoryId,
        name: name.trim(),
      },
    },
    create: {
      businessId,
      categoryId,
      name: name.trim(),
    },
    update: {},
  });
}

export async function deleteSubCategory(businessId: string, id: string) {
  const sub = await prisma.productSubCategory.findFirst({
    where: { id, businessId },
  });
  if (!sub) throw new NotFoundError("Sub category not found");
  await prisma.product.updateMany({
    where: { subCategoryId: id },
    data: { subCategoryId: null, subCategory: null },
  });
  return prisma.productSubCategory.delete({ where: { id } });
}

export async function listBrands(businessId: string) {
  return prisma.productBrand.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createBrand(businessId: string, name: string) {
  return prisma.productBrand.upsert({
    where: { businessId_name: { businessId, name: name.trim() } },
    create: { businessId, name: name.trim() },
    update: {},
  });
}

export async function deleteBrand(businessId: string, id: string) {
  const b = await prisma.productBrand.findFirst({ where: { id, businessId } });
  if (!b) throw new NotFoundError("Brand not found");
  await prisma.product.updateMany({
    where: { brandId: id },
    data: { brandId: null, brand: null },
  });
  return prisma.productBrand.delete({ where: { id } });
}

export async function listUnits(businessId: string) {
  return prisma.productUnit.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
}

export async function createUnit(
  businessId: string,
  name: string,
  abbreviation?: string,
) {
  return prisma.productUnit.upsert({
    where: { businessId_name: { businessId, name: name.trim() } },
    create: {
      businessId,
      name: name.trim(),
      abbreviation: abbreviation?.trim() || null,
    },
    update: { abbreviation: abbreviation?.trim() || null },
  });
}

export async function deleteUnit(businessId: string, id: string) {
  const u = await prisma.productUnit.findFirst({ where: { id, businessId } });
  if (!u) throw new NotFoundError("Unit not found");
  await prisma.product.updateMany({
    where: { unitId: id },
    data: { unitId: null, unit: null },
  });
  return prisma.productUnit.delete({ where: { id } });
}

export async function resolveCatalogLabels(
  businessId: string,
  input: {
    categoryId?: string;
    subCategoryId?: string;
    brandId?: string;
    unitId?: string;
  },
) {
  const [cat, sub, brand, unit] = await Promise.all([
    input.categoryId
      ? prisma.productCategory.findFirst({
          where: { id: input.categoryId, businessId },
        })
      : null,
    input.subCategoryId
      ? prisma.productSubCategory.findFirst({
          where: { id: input.subCategoryId, businessId },
        })
      : null,
    input.brandId
      ? prisma.productBrand.findFirst({
          where: { id: input.brandId, businessId },
        })
      : null,
    input.unitId
      ? prisma.productUnit.findFirst({
          where: { id: input.unitId, businessId },
        })
      : null,
  ]);

  if (input.categoryId && !cat) throw new AppError("Invalid category", 400);
  if (input.subCategoryId && !sub) throw new AppError("Invalid sub category", 400);
  if (input.brandId && !brand) throw new AppError("Invalid brand", 400);
  if (input.unitId && !unit) throw new AppError("Invalid unit", 400);

  return {
    category: cat?.name ?? undefined,
    subCategory: sub?.name ?? undefined,
    brand: brand?.name ?? undefined,
    unit: unit?.abbreviation
      ? `${unit.name} (${unit.abbreviation})`
      : unit?.name,
    categoryId: cat?.id,
    subCategoryId: sub?.id,
    brandId: brand?.id,
    unitId: unit?.id,
  };
}

export async function ensureCatalogFromNames(
  businessId: string,
  names: {
    category?: string;
    subCategory?: string;
    brand?: string;
    unit?: string;
  },
) {
  let categoryId: string | undefined;
  let subCategoryId: string | undefined;
  let brandId: string | undefined;
  let unitId: string | undefined;

  if (names.category?.trim()) {
    const cat = await createCategory(businessId, names.category);
    categoryId = cat.id;
    if (names.subCategory?.trim()) {
      const sub = await createSubCategory(
        businessId,
        names.subCategory,
        cat.id,
      );
      subCategoryId = sub.id;
    }
  }
  if (names.brand?.trim()) {
    const b = await createBrand(businessId, names.brand);
    brandId = b.id;
  }
  if (names.unit?.trim()) {
    const u = await createUnit(businessId, names.unit);
    unitId = u.id;
  }

  return resolveCatalogLabels(businessId, {
    categoryId,
    subCategoryId,
    brandId,
    unitId,
  });
}
