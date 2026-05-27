import { prisma } from "@/lib/prisma";

export async function globalSearch(businessId: string, query: string) {
  const q = query.trim();
  if (!q) {
    return { products: [], customers: [], orders: [] };
  }

  const [products, customers, orders] = await Promise.all([
    prisma.product.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.customer.findMany({
      where: {
        businessId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
    }),
    prisma.order.findMany({
      where: {
        businessId,
        OR: [
          { customer: { name: { contains: q, mode: "insensitive" } } },
          { paymentStatus: { contains: q, mode: "insensitive" } },
          { momoReference: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 8,
      include: { customer: true },
    }),
  ]);

  return { products, customers, orders };
}
