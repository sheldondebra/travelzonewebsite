import { isGarbageProductName } from "@/lib/import/detect-garbage";
import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export type ListProductsOptions = {
  search?: string;
  categoryId?: string;
  brandId?: string;
  productType?: "SIMPLE" | "VARIABLE";
  status?: "active" | "inactive" | "all";
  includeDeleted?: boolean;
  lowStock?: boolean;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock";
  limit?: number;
  includeNonLegacy?: boolean;
  page?: number;
  pageSize?: number;
};

const productInclude = {
  categoryRef: { select: { id: true, name: true } },
  subCategoryRef: { select: { id: true, name: true } },
  brandRef: { select: { id: true, name: true } },
  unitRef: { select: { id: true, name: true, abbreviation: true } },
  variants: {
    where: { deletedAt: null, isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      imageUrl: true,
      retailPrice: true,
      wholesalePrice: true,
      minimumPrice: true,
      stockQuantity: true,
    },
  },
  _count: { select: { variants: true } },
} as const;

async function buildProductWhere(
  businessId: string,
  opts?: ListProductsOptions,
  threshold?: number,
) {
  const search = opts?.search?.trim();
  const status = opts?.status ?? "active";

  return {
    businessId,
    ...(opts?.includeDeleted ? {} : { deletedAt: null }),
    ...(status === "active" ? { isActive: true } : {}),
    ...(status === "inactive" ? { isActive: false } : {}),
    ...(opts?.categoryId ? { categoryId: opts.categoryId } : {}),
    ...(opts?.brandId ? { brandId: opts.brandId } : {}),
    ...(opts?.productType ? { productType: opts.productType } : {}),
    ...(opts?.stockStatus === "out_of_stock" ? { stockQuantity: { lte: 0 } } : {}),
    ...(opts?.stockStatus === "in_stock" ? { stockQuantity: { gt: 0 } } : {}),
    ...(opts?.stockStatus === "low_stock" || opts?.lowStock
      ? {
          stockQuantity: {
            gt: 0,
            lte: threshold ?? 5,
          },
        }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
            { barcode: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

async function getLowStockThreshold(
  businessId: string,
  opts?: ListProductsOptions,
) {
  const needsThreshold = opts?.lowStock || opts?.stockStatus === "low_stock";
  if (!needsThreshold) return undefined;
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { lowStockThreshold: true },
  });
  return business?.lowStockThreshold ?? 5;
}

export async function listProducts(businessId: string, opts?: ListProductsOptions) {
  const threshold = await getLowStockThreshold(businessId, opts);
  const where = await buildProductWhere(businessId, opts, threshold);

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 500,
    include: productInclude,
  });

  return products.filter((p) => !isGarbageProductName(p.name));
}

export async function listProductsPaginated(
  businessId: string,
  opts: ListProductsOptions & { page: number; pageSize: number },
): Promise<Paginated<Awaited<ReturnType<typeof listProducts>>[number]>> {
  const threshold = await getLowStockThreshold(businessId, opts);
  const where = await buildProductWhere(businessId, opts, threshold);
  const page = opts.page;
  const pageSize = opts.pageSize;

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: productInclude,
    }),
  ]);

  const items = products.filter((p) => !isGarbageProductName(p.name));
  return paginatedResult(items, total, page, pageSize);
}

export async function getProduct(businessId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
    include: {
      categoryRef: true,
      subCategoryRef: true,
      brandRef: true,
      unitRef: true,
      variants: {
        where: { deletedAt: null },
        orderBy: { name: "asc" },
      },
      stocks: true,
    },
  });
}
