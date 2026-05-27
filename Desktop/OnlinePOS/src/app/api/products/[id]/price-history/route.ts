import { getProductPriceHistory } from "@/server/services/product/pricing/get-price-history";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const history = await getProductPriceHistory(
      businessId,
      id,
      searchParams.get("variantId") ?? undefined,
    );
    return apiSuccess(history, "Price history loaded");
  });
}
