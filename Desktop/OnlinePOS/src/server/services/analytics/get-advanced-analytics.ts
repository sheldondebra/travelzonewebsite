import { prisma } from "@/lib/prisma";
import { getExpenseTotal } from "@/server/services/expense/list-expenses";
import { getDashboardAnalytics } from "@/server/services/analytics/get-dashboard";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";

export async function getAdvancedAnalytics(businessId: string) {
  const overview = await getDashboardAnalytics(businessId);
  const now = new Date();

  const months = await Promise.all(
    [0, 1, 2, 3, 4, 5].map(async (i) => {
      const start = startOfMonth(subMonths(now, i));
      const end = endOfMonth(subMonths(now, i));
      const [orders, expenses] = await Promise.all([
        prisma.order.aggregate({
          where: { businessId, createdAt: { gte: start, lte: end } },
          _sum: { totalAmount: true, profit: true },
          _count: true,
        }),
        getExpenseTotal(businessId, start, end),
      ]);
      return {
        month: format(start, "MMM yyyy"),
        revenue: orders._sum.totalAmount ?? 0,
        profit: (orders._sum.profit ?? 0) - expenses,
        orders: orders._count,
        expenses,
      };
    }),
  );

  const thirtyDaysAgo = subDays(now, 30);
  const [newCustomers, topCustomers] = await Promise.all([
    prisma.customer.count({
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.order.groupBy({
      by: ["customerId"],
      where: { businessId, createdAt: { gte: thirtyDaysAgo } },
      _sum: { totalAmount: true },
      orderBy: { _sum: { totalAmount: "desc" } },
      take: 5,
    }),
  ]);

  const customerIds = topCustomers.map((c) => c.customerId);
  const customers = await prisma.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true },
  });
  const customerMap = new Map(customers.map((c) => [c.id, c.name]));

  const topCustomersList = topCustomers.map((c) => ({
    customerId: c.customerId,
    name: customerMap.get(c.customerId) ?? "Unknown",
    spending: c._sum.totalAmount ?? 0,
  }));

  const [completedOrders, deliveredOrders, totalOrders, avgRating] =
    await Promise.all([
      prisma.order.count({
        where: { businessId, deliveryStatus: "delivered" },
      }),
      prisma.order.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId } }),
      prisma.businessReview.aggregate({
        where: { businessId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

  const deliveryRate =
    totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  const revenueGrowth =
    months[0]?.revenue && months[1]?.revenue
      ? ((months[0].revenue - months[1].revenue) / months[1].revenue) * 100
      : 0;

  return {
    overview,
    monthlyTrends: months.reverse(),
    topCustomers: topCustomersList,
    customerGrowth: { newLast30Days: newCustomers },
    reputation: {
      avgRating: avgRating._avg.rating ?? 0,
      reviewCount: avgRating._count,
      deliverySuccessRate: deliveryRate,
    },
    forecasts: {
      revenueGrowthPercent: revenueGrowth,
      projectedMonthlyRevenue:
        months[months.length - 1]?.revenue *
        (1 + revenueGrowth / 100),
    },
  };
}
