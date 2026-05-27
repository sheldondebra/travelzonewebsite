import { setUserPosPin } from "@/server/services/pos/cashier";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessUserAuth, parseJsonBody } from "@/server/utils/with-auth";
import { setCashierPinSchema } from "@/server/validations/cashier";

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = setCashierPinSchema.parse(body);
    const result = await setUserPosPin(
      businessId,
      userId,
      input.userId,
      input.pin,
    );
    return apiSuccess(result, input.pin ? "PIN saved" : "PIN cleared");
  });
}
