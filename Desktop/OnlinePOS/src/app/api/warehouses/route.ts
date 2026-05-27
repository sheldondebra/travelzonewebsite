import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const warehouses = await prisma.warehouse.findMany({
      where: { businessId, deletedAt: null, isActive: true },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
    return apiSuccess(warehouses, "Warehouses loaded");
  });
}
