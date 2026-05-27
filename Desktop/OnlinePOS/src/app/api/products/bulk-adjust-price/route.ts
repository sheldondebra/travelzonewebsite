import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { bulkAdjustPrices } from "@/server/services/product/pricing/bulk-adjust-price";
import { bulkAdjustPriceSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody, withBusinessAuth } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const session = await getServerSession(authOptions);
      const body = await parseJsonBody(request);
      const input = bulkAdjustPriceSchema.parse(body);
      const result = await bulkAdjustPrices(businessId, input, session?.user?.id);
      return apiSuccess(result, `Updated ${result.updated} products`);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
