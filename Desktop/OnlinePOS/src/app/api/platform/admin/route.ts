import { prisma } from "@/lib/prisma";
import { PLATFORM_OFFICE_SLUG } from "@/lib/platform/office";
import { getPlatformOverviewAnalytics } from "@/server/services/platform/platform-overview-analytics";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";

export async function GET() {
  try {
    await requirePlatformAdmin();

    const tenantFilter = { slug: { not: PLATFORM_OFFICE_SLUG } };

    const [businesses, analytics, totalBusinesses, totalUsers, orderAgg] =
      await Promise.all([
        prisma.business.findMany({
          where: tenantFilter,
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            _count: { select: { orders: true, products: true, users: true } },
          },
        }),
        getPlatformOverviewAnalytics(),
        prisma.business.count({ where: tenantFilter }),
        prisma.user.count({ where: { role: { not: "PLATFORM_ADMIN" } } }),
        prisma.order.aggregate({
          where: { business: tenantFilter },
          _sum: { totalAmount: true },
          _count: true,
        }),
      ]);

    return apiSuccess(
      {
        businesses,
        analytics,
        platformStats: {
          totalBusinesses,
          totalUsers,
          totalOrders: orderAgg._count,
          platformRevenue: analytics.totals.platformRevenue,
          paidBusinesses: analytics.totals.paidBusinesses,
          orderRevenue: analytics.totals.orderRevenue,
          billingRevenue: analytics.totals.billingRevenue,
          smsRevenue: analytics.totals.smsRevenue,
        },
      },
      "Platform overview",
    );
  } catch (error) {
    return handleApiError(error);
  }
}
