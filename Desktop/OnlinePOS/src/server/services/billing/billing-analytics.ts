import { format, startOfDay, subDays } from "date-fns";
import { BillingPaymentStatus, BillingSubscriptionStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const DAYS = 30;

function dayKeys() {
  return Array.from({ length: DAYS }, (_, i) =>
    format(startOfDay(subDays(new Date(), DAYS - 1 - i)), "yyyy-MM-dd"),
  );
}

export async function getBillingAnalytics() {
  const since = startOfDay(subDays(new Date(), DAYS - 1));
  const [
    payments,
    recentPayments,
    activeSubscriptions,
    statusGroups,
    providerGroups,
  ] = await Promise.all([
    prisma.billingPayment.aggregate({
      where: { status: BillingPaymentStatus.SUCCEEDED },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.billingPayment.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, totalAmount: true, status: true },
    }),
    prisma.billingSubscription.count({
      where: { status: BillingSubscriptionStatus.ACTIVE },
    }),
    prisma.billingPayment.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.billingPayment.groupBy({
      by: ["provider"],
      _count: { id: true },
      _sum: { totalAmount: true },
    }),
  ]);

  const revenueByDay = Object.fromEntries(dayKeys().map((key) => [key, 0]));
  const failuresByDay = Object.fromEntries(dayKeys().map((key) => [key, 0]));

  for (const payment of recentPayments) {
    const key = format(startOfDay(payment.createdAt), "yyyy-MM-dd");
    if (!(key in revenueByDay)) continue;
    if (payment.status === BillingPaymentStatus.SUCCEEDED) {
      revenueByDay[key] += payment.totalAmount;
    }
    if (
      payment.status === BillingPaymentStatus.FAILED ||
      payment.status === BillingPaymentStatus.DECLINED
    ) {
      failuresByDay[key] += 1;
    }
  }

  const keys = dayKeys();
  return {
    totals: {
      revenue: payments._sum.totalAmount ?? 0,
      successfulPayments: payments._count,
      activeSubscriptions,
      failedOrDeclined: statusGroups
        .filter(
          (row) =>
            row.status === BillingPaymentStatus.FAILED ||
            row.status === BillingPaymentStatus.DECLINED,
        )
        .reduce((sum, row) => sum + row._count.id, 0),
    },
    revenueTrend: keys.map((key) => ({
      label: format(new Date(key), "MMM d"),
      revenue: revenueByDay[key] ?? 0,
      failures: failuresByDay[key] ?? 0,
    })),
    paymentStatusBreakdown: statusGroups.map((row) => ({
      status: row.status,
      count: row._count.id,
    })),
    providerBreakdown: providerGroups.map((row) => ({
      provider: row.provider,
      count: row._count.id,
      revenue: row._sum.totalAmount ?? 0,
    })),
  };
}
