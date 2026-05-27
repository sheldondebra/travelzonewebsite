import { format, subDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";

const DAYS = 14;

function dayKeys() {
  const keys: string[] = [];
  for (let i = DAYS - 1; i >= 0; i--) {
    keys.push(format(startOfDay(subDays(new Date(), i)), "yyyy-MM-dd"));
  }
  return keys;
}

function initDayMap() {
  const map: Record<string, number> = {};
  for (const k of dayKeys()) map[k] = 0;
  return map;
}

export async function getPlatformSmsAnalytics() {
  const since = startOfDay(subDays(new Date(), DAYS - 1));

  const [logs, purchases, pendingLogs, deliveredLogs] = await Promise.all([
    prisma.smsLog.findMany({
      where: { createdAt: { gte: since } },
      select: {
        status: true,
        category: true,
        smsUnits: true,
        createdAt: true,
      },
    }),
    prisma.smsPurchase.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: since } },
      select: { amount: true, smsCount: true, createdAt: true },
    }),
    prisma.smsLog.count({ where: { status: "PENDING" } }),
    prisma.smsLog.count({ where: { status: "DELIVERED" } }),
  ]);

  const usageByDay = initDayMap();
  const failedByDay = initDayMap();
  const creditsByDay = initDayMap();
  const revenueByDay = initDayMap();

  const statusCounts: Record<string, number> = {
    SENT: 0,
    FAILED: 0,
    PENDING: 0,
    DELIVERED: 0,
    UNDELIVERED: 0,
  };
  const categoryCounts: Record<string, number> = {};

  for (const log of logs) {
    const key = format(startOfDay(log.createdAt), "yyyy-MM-dd");
    statusCounts[log.status] = (statusCounts[log.status] ?? 0) + 1;
    categoryCounts[log.category] = (categoryCounts[log.category] ?? 0) + log.smsUnits;

    if (log.status === "SENT" || log.status === "DELIVERED") {
      if (key in usageByDay) usageByDay[key] += log.smsUnits;
    }
    if (log.status === "FAILED") {
      if (key in failedByDay) failedByDay[key] += log.smsUnits;
    }
  }

  let creditsSold = 0;
  let revenueTotal = 0;
  for (const p of purchases) {
    const key = format(startOfDay(p.createdAt), "yyyy-MM-dd");
    creditsSold += p.smsCount;
    revenueTotal += p.amount;
    if (key in creditsByDay) creditsByDay[key] += p.smsCount;
    if (key in revenueByDay) revenueByDay[key] += p.amount;
  }

  const labels = dayKeys().map((k) => format(new Date(k), "MMM d"));

  return {
    usageTrend: dayKeys().map((k, i) => ({
      label: labels[i],
      sent: usageByDay[k] ?? 0,
      failed: failedByDay[k] ?? 0,
    })),
    creditsTrend: dayKeys().map((k, i) => ({
      label: labels[i],
      units: creditsByDay[k] ?? 0,
      revenue: revenueByDay[k] ?? 0,
    })),
    deliveryBreakdown: Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status,
        label: status.charAt(0) + status.slice(1).toLowerCase().replace("_", " "),
        count,
      })),
    categoryUsage: Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, units]) => ({
        category,
        label: category.replace(/_/g, " "),
        units,
      })),
    summary: {
      creditsSoldPeriod: creditsSold,
      revenuePeriod: revenueTotal,
      unitsUsedPeriod: Object.values(usageByDay).reduce((a, b) => a + b, 0),
      pendingDelivery: pendingLogs,
      deliveredCount: deliveredLogs,
    },
  };
}
