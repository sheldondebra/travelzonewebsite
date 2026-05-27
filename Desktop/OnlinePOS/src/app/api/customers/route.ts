import { createCustomer } from "@/server/services/customer/create-customer";
import {
  listCustomers,
  listCustomersPaginatedWithSegments,
  type CustomerListSegment,
  type CustomerListSort,
} from "@/server/services/customer/list-customers";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import {
  parsePaginationQuery,
  wantsPagination,
} from "@/server/validations/pagination";
import { createCustomerSchema } from "@/server/validations/customer";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const login = searchParams.get("hasLogin");
    const search = searchParams.get("search") ?? undefined;
    const segment = (searchParams.get("segment") ?? "all") as CustomerListSegment;
    const sort = (searchParams.get("sort") ?? "name") as CustomerListSort;
    const hasLogin =
      login === "true" ? true : login === "false" ? false : undefined;

    if (wantsPagination(searchParams)) {
      const { page, pageSize } = parsePaginationQuery(searchParams);
      const result = await listCustomersPaginatedWithSegments(businessId, {
        hasLogin,
        search,
        segment,
        sort,
        page,
        pageSize,
      });
      return apiSuccess(result, "Customers fetched successfully");
    }

    const customers = await listCustomers(businessId, { hasLogin, search });
    return apiSuccess(customers, "Customers fetched successfully");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = createCustomerSchema.parse(body);
    const customer = await createCustomer(businessId, input);
    return apiSuccess(customer, "Customer created successfully", 201);
  });
}
