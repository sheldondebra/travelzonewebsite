import { applyOpeningStock } from "@/server/services/product/stock-operations";
import { openingStockSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = openingStockSchema.parse(body);
      const result = await applyOpeningStock(businessId, input.items);
      return apiSuccess(result, "Opening stock applied");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
