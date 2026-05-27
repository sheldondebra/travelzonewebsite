import { format, startOfDay, subDays } from "date-fns";
import { BillingPaymentStatus } from "@/generated/prisma/client";
import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import { prisma } from "@/lib/prisma";

const DAYS = 30;

const PLAN_LABELS: Record<string, string> = {
  FREE: "Free",
  PRO: "Pro",
  BUSINESS: "Business",
  ENTERPRISE: "Enterprise",
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#94A3B8",
  PRO: "#8B5CF6",
  BUSINESS: "#3B82F6",
  ENTERPRISE: "#F59E0B",
};

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

const tenantFilter = { slug: { not: PLATFORM_OFFICE_SLUG } };

export async function getPlatformOverviewAnalytics() {
  const since = startOfDay(subDays(new Date(), DAYS - 1));

  const [
    totalBusinesses,
    totalUsers,
    paidBusinesses,
    planGroups,
    newBusinesses,
    newUsers,
    orderAgg,
    billingRevenueAgg,
    smsRevenueAgg,
    ordersRecent,
    billingRecent,
    smsRecent,
  ] = await Promise.all([
    prisma.business.count({ where: tenantFilter }),
    prisma.user.count({
      where: { role: { not: "PLATFORM_ADMIN" } },
    }),
    prisma.business.count({
      where: { ...tenantFilter, subscriptionPlan: { not: "FREE" } },
    }),
    prisma.business.groupBy({
      by: ["subscriptionPlan"],
      where: tenantFilter,
      _count: { id: true },
    }),
    prisma.business.findMany({
      where: { ...tenantFilter, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since }, role: { not: "PLATFORM_ADMIN" } },
      select: { createdAt: true },
    }),
    prisma.order.aggregate({
      where: { business: tenantFilter },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.billingPayment.aggregate({
      where: { status: BillingPaymentStatus.SUCCEEDED },
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.smsPurchase.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { business: tenantFilter, createdAt: { gte: since } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.billingPayment.findMany({
      where: { status: BillingPaymentStatus.SUCCEEDED, createdAt: { gte: since } },
      select: { totalAmount: true, createdAt: true },
    }),
    prisma.smsPurchase.findMany({
      where: { paymentStatus: "PAID", createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
    }),
  ]);

  const businessesByDay = initDayMap();
  const usersByDay = initDayMap();
  const revenueByDay = initDayMap();

  for (const b of newBusinesses) {
    const key = format(startOfDay(b.createdAt), "yyyy-MM-dd");
    if (key in businessesByDay) businessesByDay[key]++;
  }
  for (const u of newUsers) {
    const key = format(startOfDay(u.createdAt), "yyyy-MM-dd");
    if (key in usersByDay) usersByDay[key]++;
  }
  for (const o of ordersRecent) {
    const key = format(startOfDay(o.createdAt), "yyyy-MM-dd");
    if (key in revenueByDay) revenueByDay[key] += o.totalAmount;
  }
  for (const p of billingRecent) {
    const key = format(startOfDay(p.createdAt), "yyyy-MM-dd");
    if (key in revenueByDay) revenueByDay[key] += p.totalAmount;
  }
  for (const p of smsRecent) {
    const key = format(startOfDay(p.createdAt), "yyyy-MM-dd");
    if (key in revenueByDay) revenueByDay[key] += p.amount;
  }

  const keys = dayKeys();
  const labels = keys.map((k) => format(new Date(k), "MMM d"));

  const planBreakdown = planGroups.map((g) => ({
    plan: g.subscriptionPlan,
    label: PLAN_LABELS[g.subscriptionPlan] ?? g.subscriptionPlan,
    count: g._count.id,
    color: PLAN_COLORS[g.subscriptionPlan] ?? "#F8BBD0",
  }));

  const paidPlans = planBreakdown.filter((p) => p.plan !== "FREE");
  const paidPlanTotal = paidPlans.reduce((s, p) => s + p.count, 0);

  return {
    totals: {
      businesses: totalBusinesses,
      users: totalUsers,
      paidBusinesses,
      paidPlanTotal,
      orders: orderAgg._count,
      orderRevenue: orderAgg._sum.totalAmount ?? 0,
      billingRevenue: billingRevenueAgg._sum.totalAmount ?? 0,
      billingPayments: billingRevenueAgg._count,
      smsRevenue: smsRevenueAgg._sum.amount ?? 0,
      smsPurchases: smsRevenueAgg._count,
      platformRevenue:
        (billingRevenueAgg._sum.totalAmount ?? 0) + (smsRevenueAgg._sum.amount ?? 0),
    },
    growthTrend: keys.map((k, i) => ({
      label: labels[i],
      businesses: businessesByDay[k] ?? 0,
      users: usersByDay[k] ?? 0,
    })),
    revenueTrend: keys.map((k, i) => ({
      label: labels[i],
      revenue: revenueByDay[k] ?? 0,
    })),
    planBreakdown,
    paidPlans,
  };
}
