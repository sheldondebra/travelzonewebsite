import { getCustomerStats } from "@/server/services/customer/customer-stats";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const stats = await getCustomerStats(businessId);
    return apiSuccess(stats, "Customer stats fetched");
  });
}
