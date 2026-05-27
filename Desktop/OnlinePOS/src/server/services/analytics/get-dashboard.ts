import { prisma } from "@/lib/prisma";
import { getExpenseTotal } from "@/server/services/expense/list-expenses";
import { startOfDay, startOfWeek, startOfMonth, subDays } from "date-fns";

export async function getDashboardAnalytics(businessId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { lowStockThreshold: true, currency: true },
  });
  const threshold = business?.lowStockThreshold ?? 5;

  const [
    ordersAgg,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalExpenses,
    monthExpenses,
    lowStock,
    orderItems,
    pendingDeliveries,
    unreadNotifications,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { businessId },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: todayStart } },
      _sum: { totalAmount: true, profit: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: weekStart } },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { businessId, createdAt: { gte: monthStart } },
      _sum: { totalAmount: true },
    }),
    getExpenseTotal(businessId),
    getExpenseTotal(businessId, monthStart, now),
    prisma.product.findMany({
      where: {
        businessId,
        deletedAt: null,
        isActive: true,
        oldId: { not: null },
        stockQuantity: { lte: threshold },
      },
      orderBy: { stockQuantity: "asc" },
      take: 8,
      select: { id: true, name: true, stockQuantity: true, sku: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { businessId, createdAt: { gte: subDays(now, 90) } } },
      select: {
        productId: true,
        quantity: true,
        product: { select: { name: true } },
      },
    }),
    prisma.order.count({
      where: {
        businessId,
        deliveryStatus: { in: ["pending", "processing", "shipped"] },
      },
    }),
    prisma.notification.count({
      where: { businessId, read: false },
    }),
  ]);

  const revenue = ordersAgg._sum.totalAmount ?? 0;
  const grossProfit = ordersAgg._sum.profit ?? 0;
  const netProfit = grossProfit - totalExpenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const sellerMap = new Map<
    string,
    { productId: string; name: string; quantity: number }
  >();
  for (const item of orderItems) {
    const existing = sellerMap.get(item.productId);
    if (existing) existing.quantity += item.quantity;
    else
      sellerMap.set(item.productId, {
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
      });
  }

  const bestSellers = [...sellerMap.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const [outOfStock, productCount, customerCount] = await Promise.all([
    prisma.product.count({
      where: {
        businessId,
        deletedAt: null,
        isActive: true,
        oldId: { not: null },
        stockQuantity: 0,
      },
    }),
    prisma.product.count({
      where: { businessId, deletedAt: null, oldId: { not: null } },
    }),
    prisma.customer.count({ where: { businessId } }),
  ]);

  return {
    currency: business?.currency ?? "GHS",
    revenue,
    grossProfit,
    expenses: totalExpenses,
    netProfit,
    profitMargin,
    orderCount: ordersAgg._count,
    today: {
      revenue: todayRevenue._sum.totalAmount ?? 0,
      profit: todayRevenue._sum.profit ?? 0,
      orders: todayRevenue._count,
    },
    week: { revenue: weekRevenue._sum.totalAmount ?? 0 },
    month: {
      revenue: monthRevenue._sum.totalAmount ?? 0,
      expenses: monthExpenses,
    },
    lowStock,
    outOfStock,
    bestSellers,
    pendingDeliveries,
    unreadNotifications,
    productCount,
    customerCount,
  };
}
