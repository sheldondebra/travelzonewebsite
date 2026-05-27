import { getOrCreateWalkInCustomer } from "@/server/services/customer/walk-in-customer";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const customer = await getOrCreateWalkInCustomer(businessId);
    return apiSuccess(customer, "Walk-in customer ready");
  });
}
