import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { listBillingPlans } from "@/server/services/billing/billing-service";

export async function GET() {
  try {
    const plans = await listBillingPlans(false);
    return apiSuccess(plans, "Billing plans loaded");
  } catch (error) {
    return handleApiError(error);
  }
}
