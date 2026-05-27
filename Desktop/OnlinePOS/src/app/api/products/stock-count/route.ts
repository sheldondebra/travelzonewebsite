import { applyStockCount } from "@/server/services/product/stock-operations";
import { stockCountSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = stockCountSchema.parse(body);
      const result = await applyStockCount(businessId, input.items);
      return apiSuccess(result, `Adjusted ${result.adjusted} products`);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
