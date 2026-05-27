import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export async function createSupplier(
  businessId: string,
  data: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    notes?: string;
  },
) {
  return prisma.supplier.create({ data: { ...data, businessId } });
}

export async function listSuppliers(businessId: string) {
  return prisma.supplier.findMany({
    where: { businessId },
    orderBy: { name: "asc" },
    include: { _count: { select: { orders: true } } },
  });
}

export async function listSuppliersPaginated(
  businessId: string,
  opts: { page: number; pageSize: number },
): Promise<Paginated<Awaited<ReturnType<typeof listSuppliers>>[number]>> {
  const { page, pageSize } = opts;
  const where = { businessId };

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { orders: true } } },
    }),
  ]);

  return paginatedResult(suppliers, total, page, pageSize);
}
