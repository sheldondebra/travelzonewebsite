import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Products visible on storefront URLs (/store/...). */
function publicStoreProductWhere(
  extra?: Prisma.ProductWhereInput,
): Prisma.ProductWhereInput {
  return {
    isPublic: true,
    deletedAt: null,
    ...extra,
  };
}

function businessSlugWhere(slug: string): Prisma.BusinessWhereInput {
  return { slug: { equals: slug.trim(), mode: "insensitive" } };
}

export async function listMarketplaceStores(opts?: {
  category?: string;
  search?: string;
  featured?: boolean;
}) {
  const search = opts?.search?.trim();

  const businesses = await prisma.business.findMany({
    where: {
      isPublic: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isVerified: "desc" }, { reputationScore: "desc" }],
    take: 24,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logoUrl: true,
      bannerUrl: true,
      badges: true,
      isVerified: true,
      reputationScore: true,
      products: {
        where: {
          isPublic: true,
          stockQuantity: { gt: 0 },
          ...(opts?.category ? { category: opts.category } : {}),
        },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          price: true,
          imageUrl: true,
          category: true,
        },
      },
      _count: { select: { products: true, reviews: true } },
    },
  });

  return businesses;
}

/** Public storefront by slug. `isPublic` only gates marketplace directory listing. */
export async function getPublicStore(slug: string) {
  return prisma.business.findFirst({
    where: businessSlugWhere(slug),
    include: {
      products: {
        where: publicStoreProductWhere(),
        orderBy: { createdAt: "desc" },
      },
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
}

export async function getPublicProduct(businessSlug: string, productSlug: string) {
  const business = await prisma.business.findFirst({
    where: businessSlugWhere(businessSlug),
  });
  if (!business) return null;

  const product = await prisma.product.findFirst({
    where: {
      businessId: business.id,
      slug: { equals: productSlug.trim(), mode: "insensitive" },
      ...publicStoreProductWhere(),
    },
    include: { business: true },
  });

  return product;
}
