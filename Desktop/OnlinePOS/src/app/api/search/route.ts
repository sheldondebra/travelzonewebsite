import { globalSearch } from "@/server/services/search/global-search";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const q = new URL(request.url).searchParams.get("q") ?? "";
    const results = await globalSearch(businessId, q);
    return apiSuccess(results, "Search completed");
  });
}
