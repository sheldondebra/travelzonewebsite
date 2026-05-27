import {
  createUnit,
  listUnits,
} from "@/server/services/catalog/catalog-service";
import { catalogNameSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const data = await listUnits(businessId);
    return apiSuccess(data, "Units fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const parsed = catalogNameSchema.parse(body);
      const data = await createUnit(
        businessId,
        parsed.name,
        parsed.abbreviation,
      );
      return apiSuccess(data, "Unit saved", 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
