import {
  createCategory,
  listCategories,
} from "@/server/services/catalog/catalog-service";
import { catalogNameSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const data = await listCategories(businessId);
    return apiSuccess(data, "Categories fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const { name } = catalogNameSchema.parse(body);
      const data = await createCategory(businessId, name);
      return apiSuccess(data, "Category saved", 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
