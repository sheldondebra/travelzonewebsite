import { verifyCashierPin } from "@/server/services/pos/cashier";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { verifyCashierPinSchema } from "@/server/validations/cashier";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = verifyCashierPinSchema.parse(body);
    const result = await verifyCashierPin(businessId, input.pin);
    return apiSuccess(result, "Cashier verified");
  });
}
