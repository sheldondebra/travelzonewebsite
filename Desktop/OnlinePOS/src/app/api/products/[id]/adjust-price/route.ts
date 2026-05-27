import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adjustProductPrice } from "@/server/services/product/pricing/adjust-product-price";
import { adjustPriceSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody, withBusinessAuth } from "@/server/utils/with-auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const session = await getServerSession(authOptions);
      const body = await parseJsonBody(request);
      const input = adjustPriceSchema.parse(body);
      const product = await adjustProductPrice(
        businessId,
        id,
        input,
        session?.user?.id,
      );
      return apiSuccess(product, "Price updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
