import { deleteProduct } from "@/server/services/product/delete-product";
import { updateProduct } from "@/server/services/product/update-product";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { updateProductSchema } from "@/server/validations/product";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = updateProductSchema.parse(body);
    const product = await updateProduct(businessId, id, input);
    return apiSuccess(product, "Product updated successfully");
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const result = await deleteProduct(businessId, id);
    return apiSuccess(result, "Product deleted successfully");
  });
}
