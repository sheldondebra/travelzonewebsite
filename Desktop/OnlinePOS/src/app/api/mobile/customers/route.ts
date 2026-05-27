import { createCustomer } from "@/server/services/customer/create-customer";
import { listCustomers } from "@/server/services/customer/list-customers";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { createCustomerSchema } from "@/server/validations/customer";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const customers = await listCustomers(businessId);
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
