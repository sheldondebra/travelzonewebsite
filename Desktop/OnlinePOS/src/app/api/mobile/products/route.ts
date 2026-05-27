import { listProducts } from "@/server/services/product/list-products";
import { createProduct } from "@/server/services/product/create-product";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { createProductSchema } from "@/server/validations/product";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const products = await listProducts(businessId);
    return apiSuccess(products, "Products fetched successfully");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = createProductSchema.parse(body);
    const product = await createProduct(businessId, input);
    return apiSuccess(product, "Product created successfully", 201);
  });
}
