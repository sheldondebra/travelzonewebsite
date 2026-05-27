import { listProducts } from "@/server/services/product/list-products";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const products = await listProducts(businessId, {
      search: searchParams.get("q") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      brandId: searchParams.get("brandId") ?? undefined,
      status: "active",
    });
    return apiSuccess(products, "POS products fetched");
  });
}
