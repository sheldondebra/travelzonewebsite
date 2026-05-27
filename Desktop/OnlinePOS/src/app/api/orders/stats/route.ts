import { getOrdersStats } from "@/server/services/order/get-orders-stats";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const stats = await getOrdersStats(businessId);
    return apiSuccess(stats, "Order stats loaded");
  });
}
