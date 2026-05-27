import { getCustomerDetail } from "@/server/services/customer/get-customer-detail";
import { updateCustomer } from "@/server/services/customer/update-customer";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { updateCustomerSchema } from "@/server/validations/customer";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const customer = await getCustomerDetail(businessId, id);
    return apiSuccess(customer, "Customer fetched");
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = updateCustomerSchema.parse(body);
    const customer = await updateCustomer(businessId, id, input);
    return apiSuccess(customer, "Customer updated");
  });
}
