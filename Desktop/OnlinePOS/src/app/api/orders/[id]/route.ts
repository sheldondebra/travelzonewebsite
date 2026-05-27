import { getReceiptData } from "@/server/services/order/get-receipt";
import { updateOrder } from "@/server/services/order/update-order";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { updateOrderSchema } from "@/server/validations/order";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const order = await getReceiptData(businessId, id);
    return apiSuccess(order, "Order fetched");
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = updateOrderSchema.parse(body);
    const order = await updateOrder(businessId, id, input);
    return apiSuccess(order, "Order updated");
  });
}
