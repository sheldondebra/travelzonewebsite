import { createProduct } from "@/server/services/product/create-product";
import {
  listProducts,
  listProductsPaginated,
  type ListProductsOptions,
} from "@/server/services/product/list-products";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import { createProductSchema } from "@/server/validations/product";

function productListOptions(searchParams: URLSearchParams): ListProductsOptions {
  const type = searchParams.get("type");
  return {
    search: searchParams.get("q") ?? undefined,
    categoryId: searchParams.get("categoryId") ?? undefined,
    brandId: searchParams.get("brandId") ?? undefined,
    productType:
      type === "simple"
        ? "SIMPLE"
        : type === "variable"
          ? "VARIABLE"
          : undefined,
    status:
      searchParams.get("status") === "inactive"
        ? ("inactive" as const)
        : searchParams.get("status") === "all"
          ? ("all" as const)
          : ("active" as const),
    lowStock: searchParams.get("lowStock") === "1",
    stockStatus:
      searchParams.get("stock") === "out"
        ? ("out_of_stock" as const)
        : searchParams.get("stock") === "low"
          ? ("low_stock" as const)
          : searchParams.get("stock") === "in"
            ? ("in_stock" as const)
            : undefined,
  };
}

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const opts = productListOptions(searchParams);

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listProductsPaginated(businessId, {
        ...opts,
        page,
        pageSize,
      });
      return apiSuccess(result, "Products fetched successfully");
    }

    const products = await listProducts(businessId, opts);
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
