import { isGarbageProductName } from "@/lib/import/detect-garbage";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const catalogWhere = {
      businessId,
      deletedAt: null,
    } as const;

    const [total, active, withImages, variable, simple, customers, orders, names] =
      await Promise.all([
        prisma.product.count({ where: catalogWhere }),
        prisma.product.count({
          where: { ...catalogWhere, isActive: true },
        }),
        prisma.product.count({
          where: { ...catalogWhere, imageUrl: { not: null } },
        }),
        prisma.product.count({
          where: { ...catalogWhere, productType: "VARIABLE" },
        }),
        prisma.product.count({
          where: { ...catalogWhere, productType: "SIMPLE" },
        }),
        prisma.customer.count({ where: { businessId } }),
        prisma.order.count({ where: { businessId } }),
        prisma.product.findMany({
          where: { businessId, deletedAt: null },
          select: { name: true },
        }),
      ]);

    const invalidImports = names.filter((p) => isGarbageProductName(p.name)).length;

    return apiSuccess(
      {
        total,
        active,
        inactive: total - active,
        withImages,
        variable,
        simple,
        customers,
        orders,
        invalidImports,
      },
      "Product stats fetched",
    );
  });
}
