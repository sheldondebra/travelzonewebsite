import { getAdvancedAnalytics } from "@/server/services/analytics/get-advanced-analytics";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const data = await getAdvancedAnalytics(businessId);
    return apiSuccess(data, "Advanced analytics fetched");
  });
}
