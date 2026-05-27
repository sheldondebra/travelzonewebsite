import { getImportCoverage } from "@/server/services/import/get-import-coverage";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const coverage = await getImportCoverage(businessId);
      return apiSuccess(coverage, "Import coverage loaded");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
