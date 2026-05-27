import { deleteProduct } from "@/server/services/product/delete-product";
import { getProduct } from "@/server/services/product/list-products";
import { updateProduct } from "@/server/services/product/update-product";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { updateProductSchema } from "@/server/validations/product";
import { NotFoundError } from "@/server/utils/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const product = await getProduct(businessId, id);
      if (!product) throw new NotFoundError("Product not found");
      return apiSuccess(product, "Product fetched");
    } catch (error) {
      return handleApiError(error);
    }
  });
}

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
