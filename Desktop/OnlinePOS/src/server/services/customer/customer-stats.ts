import { subDays, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

const ACTIVE_DAYS = 90;

export type CustomerStats = {
  total: number;
  withPhone: number;
  withLogin: number;
  active90: number;
  newThisMonth: number;
  repeatBuyers: number;
  noOrders: number;
  topBuyers: {
    id: string;
    name: string;
    phone: string | null;
    orderCount: number;
    totalSpending: number;
  }[];
};

export async function getCustomerStats(businessId: string): Promise<CustomerStats> {
  const now = new Date();
  const activeSince = subDays(now, ACTIVE_DAYS);
  const monthStart = startOfMonth(now);

  const baseWhere = { businessId };

  const [
    total,
    withPhone,
    withLogin,
    active90,
    newThisMonth,
    noOrders,
    repeatRows,
    topGroups,
  ] = await Promise.all([
    prisma.customer.count({ where: baseWhere }),
    prisma.customer.count({
      where: { ...baseWhere, phone: { not: null, notIn: [""] } },
    }),
    prisma.customer.count({
      where: { ...baseWhere, userId: { not: null } },
    }),
    prisma.customer.count({
      where: {
        ...baseWhere,
        orders: { some: { createdAt: { gte: activeSince } } },
      },
    }),
    prisma.customer.count({
      where: { ...baseWhere, createdAt: { gte: monthStart } },
    }),
    prisma.customer.count({
      where: { ...baseWhere, orders: { none: {} } },
    }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM (
        SELECT o."customerId"
        FROM "Order" o
        WHERE o."businessId" = ${businessId}
        GROUP BY o."customerId"
        HAVING COUNT(*) >= 2
      ) AS repeat_customers
    `,
    prisma.order.groupBy({
      by: ["customerId"],
      where: { businessId },
      _sum: { totalAmount: true },
      _count: { id: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
  ]);

  const repeatBuyers = Number(repeatRows[0]?.count ?? 0);

  const customerIds = topGroups.map((g) => g.customerId);
  const customers =
    customerIds.length > 0
      ? await prisma.customer.findMany({
          where: { id: { in: customerIds }, businessId },
          select: { id: true, name: true, phone: true },
        })
      : [];
  const customerMap = new Map(customers.map((c) => [c.id, c]));

  const topBuyers = topGroups
    .map((g) => {
      const c = customerMap.get(g.customerId);
      if (!c) return null;
      return {
        id: c.id,
        name: c.name,
        phone: c.phone,
        orderCount: g._count.id,
        totalSpending: g._sum.totalAmount ?? 0,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return {
    total,
    withPhone,
    withLogin,
    active90,
    newThisMonth,
    repeatBuyers,
    noOrders,
    topBuyers,
  };
}
