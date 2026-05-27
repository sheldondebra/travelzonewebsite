import { listMarketplaceStores } from "@/server/services/marketplace/list-marketplace";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stores = await listMarketplaceStores({
      search: searchParams.get("q") ?? undefined,
      category: searchParams.get("category") ?? undefined,
    });
    return apiSuccess(stores, "Marketplace stores fetched");
  } catch (error) {
    return handleApiError(error);
  }
}
