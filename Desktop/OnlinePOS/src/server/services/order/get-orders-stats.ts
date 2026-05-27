import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/prisma";

export async function getOrdersStats(businessId: string) {
  const since = startOfDay(subDays(new Date(), 13));

  const [
    total,
    aggregates,
    paymentGroups,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({ where: { businessId } }),
    prisma.order.aggregate({
      where: { businessId },
      _sum: { totalAmount: true, profit: true },
    }),
    prisma.order.groupBy({
      by: ["paymentStatus"],
      where: { businessId },
      _count: { id: true },
    }),
    prisma.order.findMany({
      where: { businessId, createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const pending = paymentGroups.find((g) => g.paymentStatus === "pending")?._count.id ?? 0;
  const paid = paymentGroups.find((g) => g.paymentStatus === "paid")?._count.id ?? 0;

  const dayMap = new Map<string, { date: string; orders: number; revenue: number }>();
  for (let i = 0; i < 14; i++) {
    const d = format(subDays(new Date(), 13 - i), "yyyy-MM-dd");
    dayMap.set(d, { date: d, orders: 0, revenue: 0 });
  }
  for (const o of recentOrders) {
    const key = format(o.createdAt, "yyyy-MM-dd");
    const row = dayMap.get(key);
    if (row) {
      row.orders += 1;
      row.revenue += o.totalAmount;
    }
  }

  return {
    total,
    totalRevenue: aggregates._sum.totalAmount ?? 0,
    totalProfit: aggregates._sum.profit ?? 0,
    pending,
    paid,
    paymentBreakdown: paymentGroups.map((g) => ({
      status: g.paymentStatus,
      count: g._count.id,
    })),
    ordersByDay: Array.from(dayMap.values()).map((row) => ({
      ...row,
      label: format(new Date(row.date), "MMM d"),
    })),
  };
}
