import { importCustomers } from "@/server/services/customer/import-customers";
import { importCustomersSchema } from "@/server/validations/customer";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const input = importCustomersSchema.parse(body);
      const result = await importCustomers(businessId, input);
      return apiSuccess(result, `Imported ${result.imported} customers`);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
