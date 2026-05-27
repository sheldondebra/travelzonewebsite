import {
  createSubCategory,
  listSubCategories,
} from "@/server/services/catalog/catalog-service";
import { catalogNameSchema } from "@/server/validations/product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const categoryId = new URL(request.url).searchParams.get("categoryId");
    const data = await listSubCategories(
      businessId,
      categoryId ?? undefined,
    );
    return apiSuccess(data, "Sub categories fetched");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    try {
      const body = await parseJsonBody(request);
      const parsed = catalogNameSchema.parse(body);
      if (!parsed.categoryId) {
        return handleApiError(new Error("categoryId is required"));
      }
      const data = await createSubCategory(
        businessId,
        parsed.name,
        parsed.categoryId,
      );
      return apiSuccess(data, "Sub category saved", 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
