import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adjustVariantStock } from "@/server/services/stock/adjust-stock";
import { adjustStockSchema } from "@/server/validations/import";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody, withBusinessAuth } from "@/server/utils/with-auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const { variantId } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const session = await getServerSession(authOptions);
      const body = await parseJsonBody(request);
      const input = adjustStockSchema.parse(body);
      const result = await adjustVariantStock(
        businessId,
        variantId,
        input,
        session?.user?.id,
      );
      return apiSuccess(result, "Variant stock updated");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
