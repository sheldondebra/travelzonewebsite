import { importProducts } from "@/server/services/product/import-products";
import { importProductsSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = importProductsSchema.parse(body);
      const result = await importProducts(businessId, input);
      return apiSuccess(result, `Imported ${result.imported} products`);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
