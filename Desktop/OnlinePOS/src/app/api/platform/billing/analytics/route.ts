import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { requirePlatformAdmin } from "@/server/utils/platform-auth";
import { getBillingAnalytics } from "@/server/services/billing/billing-analytics";

export async function GET() {
  try {
    await requirePlatformAdmin();
    const analytics = await getBillingAnalytics();
    return apiSuccess(analytics, "Billing analytics loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
