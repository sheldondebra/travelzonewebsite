import {
  createBrand,
  listBrands,
} from "@/server/services/catalog/catalog-service";
import { catalogNameSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const data = await listBrands(businessId);
    return apiSuccess(data, "Brands fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const { name } = catalogNameSchema.parse(body);
      const data = await createBrand(businessId, name);
      return apiSuccess(data, "Brand saved", 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
