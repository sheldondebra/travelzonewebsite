import { subDays, startOfMonth } from "date-fns";
import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";

export type CustomerListSegment =
  | "all"
  | "active"
  | "repeat"
  | "new"
  | "portal"
  | "walkin"
  | "phone"
  | "no_orders";

export type CustomerListSort = "name" | "orders" | "recent" | "spending";

export type CustomerListItem = Awaited<
  ReturnType<typeof listCustomers>
>[number] & {
  totalSpending: number;
  lastOrderAt: string | null;
};

export async function listCustomers(
  businessId: string,
  options?: { hasLogin?: boolean; limit?: number; search?: string },
) {
  const limit = options?.limit ?? 200;
  const where = buildCustomerWhere(businessId, options);

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { name: "asc" },
    take: limit,
    include: {
      _count: { select: { orders: true } },
      user: { select: { id: true, email: true } },
    },
  });

  return enrichCustomersWithOrderStats(businessId, customers);
}

export async function listCustomersPaginated(
  businessId: string,
  options: {
    hasLogin?: boolean;
    search?: string;
    segment?: CustomerListSegment;
    sort?: CustomerListSort;
    page: number;
    pageSize: number;
  },
): Promise<
  Paginated<CustomerListItem> & {
    meta: { withPhone: number; withLogin: number };
  }
> {
  const where = buildCustomerWhere(businessId, options);
  const { page, pageSize } = options;
  const sort = options.sort ?? "name";
  const orderBy = buildCustomerOrderBy(sort);

  const [total, withPhone, withLogin, customers] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.count({
      where: { ...where, phone: { not: null, notIn: [""] } },
    }),
    prisma.customer.count({
      where: { ...where, userId: { not: null } },
    }),
    prisma.customer.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { orders: true } },
        user: { select: { id: true, email: true } },
      },
    }),
  ]);

  const enriched = await enrichCustomersWithOrderStats(businessId, customers);

  return {
    ...paginatedResult(enriched, total, page, pageSize),
    meta: { withPhone, withLogin },
  };
}

async function enrichCustomersWithOrderStats<
  T extends { id: string },
>(businessId: string, customers: T[]) {
  if (customers.length === 0) return customers.map((c) => ({ ...c, totalSpending: 0, lastOrderAt: null }));

  const ids = customers.map((c) => c.id);
  const aggregates = await prisma.order.groupBy({
    by: ["customerId"],
    where: { businessId, customerId: { in: ids } },
    _sum: { totalAmount: true },
    _max: { createdAt: true },
  });
  const aggMap = new Map(
    aggregates.map((a) => [
      a.customerId,
      {
        totalSpending: a._sum.totalAmount ?? 0,
        lastOrderAt: a._max.createdAt?.toISOString() ?? null,
      },
    ]),
  );

  return customers.map((c) => {
    const stats = aggMap.get(c.id);
    return {
      ...c,
      totalSpending: stats?.totalSpending ?? 0,
      lastOrderAt: stats?.lastOrderAt ?? null,
    };
  });
}

function buildCustomerOrderBy(sort: CustomerListSort) {
  switch (sort) {
    case "orders":
      return { orders: { _count: "desc" as const } };
    case "recent":
      return { orders: { _max: { createdAt: "desc" as const } } };
    case "spending":
      return { orders: { _sum: { totalAmount: "desc" as const } } };
    default:
      return { name: "asc" as const };
  }
}

function buildCustomerWhere(
  businessId: string,
  options?: {
    hasLogin?: boolean;
    search?: string;
    segment?: CustomerListSegment;
  },
) {
  const where: {
    businessId: string;
    userId?: { equals: null } | { not: null };
    phone?: { not: null; notIn: string[] };
    createdAt?: { gte: Date };
    orders?: {
      some?: { createdAt?: { gte: Date } };
      none?: Record<string, never>;
    };
    AND?: Array<Record<string, unknown>>;
    OR?: Array<{
      name?: { contains: string; mode: "insensitive" };
      phone?: { contains: string };
      email?: { contains: string; mode: "insensitive" };
    }>;
  } = { businessId };

  if (options?.hasLogin === true) {
    where.userId = { not: null };
  } else if (options?.hasLogin === false) {
    where.userId = { equals: null };
  }

  switch (options?.segment) {
    case "active":
      where.orders = {
        some: { createdAt: { gte: subDays(new Date(), 90) } },
      };
      break;
    case "new":
      where.createdAt = { gte: startOfMonth(new Date()) };
      break;
    case "portal":
      where.userId = { not: null };
      break;
    case "walkin":
      where.userId = { equals: null };
      break;
    case "phone":
      where.phone = { not: null, notIn: [""] };
      break;
    case "no_orders":
      where.orders = { none: {} };
      break;
    default:
      break;
  }

  const q = options?.search?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listCustomersPaginatedWithSegments(
  businessId: string,
  options: Parameters<typeof listCustomersPaginated>[1],
) {
  if (options.segment === "repeat") {
    const repeatIds = await getRepeatBuyerIds(businessId);
    const where = buildCustomerWhere(businessId, {
      ...options,
      segment: "all",
    });
    const repeatWhere = { ...where, id: { in: repeatIds } };
    const { page, pageSize } = options;
    const sort = options.sort ?? "name";
    const orderBy = buildCustomerOrderBy(sort);

    const [total, withPhone, withLogin, customers] = await Promise.all([
      prisma.customer.count({ where: repeatWhere }),
      prisma.customer.count({
        where: { ...repeatWhere, phone: { not: null, notIn: [""] } },
      }),
      prisma.customer.count({
        where: { ...repeatWhere, userId: { not: null } },
      }),
      prisma.customer.findMany({
        where: repeatWhere,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { orders: true } },
          user: { select: { id: true, email: true } },
        },
      }),
    ]);

    const enriched = await enrichCustomersWithOrderStats(businessId, customers);
    return {
      ...paginatedResult(enriched, total, page, pageSize),
      meta: { withPhone, withLogin },
    };
  }

  return listCustomersPaginated(businessId, options);
}

async function getRepeatBuyerIds(businessId: string) {
  const rows = await prisma.$queryRaw<{ customerId: string }[]>`
    SELECT o."customerId"
    FROM "Order" o
    WHERE o."businessId" = ${businessId}
    GROUP BY o."customerId"
    HAVING COUNT(*) >= 2
  `;
  return rows.map((r) => r.customerId);
}
