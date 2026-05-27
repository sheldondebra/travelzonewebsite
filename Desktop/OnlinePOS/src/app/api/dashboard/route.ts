import { getDashboardAnalytics } from "@/server/services/analytics/get-dashboard";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const data = await getDashboardAnalytics(businessId);
    return apiSuccess(data, "Dashboard fetched successfully");
  });
}
