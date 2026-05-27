import { purgeGarbageProducts } from "@/server/services/product/purge-garbage-products";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const result = await purgeGarbageProducts(businessId);
      return apiSuccess(
        result,
        result.removed > 0
          ? `Removed ${result.removed} invalid import row(s)`
          : "No invalid import rows found",
      );
    } catch (error) {
      return handleApiError(error);
    }
  });
}
