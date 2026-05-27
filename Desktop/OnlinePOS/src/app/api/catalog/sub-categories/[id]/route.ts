import { deleteSubCategory } from "@/server/services/catalog/catalog-service";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      await deleteSubCategory(businessId, id);
      return apiSuccess(null, "Sub category deleted");
    } catch (error) {
      return handleApiError(error);
    }
  });
}
