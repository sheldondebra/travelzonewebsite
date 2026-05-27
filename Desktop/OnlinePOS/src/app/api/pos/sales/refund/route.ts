import { refundOrVoidSale } from "@/server/services/pos/refund";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessUserAuth, parseJsonBody } from "@/server/utils/with-auth";
import { refundSaleSchema } from "@/server/validations/pos";

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = refundSaleSchema.parse(body);
    const result = await refundOrVoidSale(businessId, userId, input);
    return apiSuccess(result, input.action === "void" ? "Sale voided" : "Refund processed");
  });
}
