import {
  importSuppliers,
  importSuppliersSchema,
} from "@/server/services/supplier/import-suppliers";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = importSuppliersSchema.parse(body);
      const result = await importSuppliers(businessId, input);
      return apiSuccess(result, `Imported ${result.imported} suppliers`);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
