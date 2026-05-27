import { createOrder } from "@/server/services/order/create-order";
import { listOrders } from "@/server/services/order/list-orders";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { createOrderSchema } from "@/server/validations/order";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const orders = await listOrders(businessId);
    return apiSuccess(orders, "Orders fetched successfully");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = createOrderSchema.parse(body);
    const order = await createOrder(businessId, input);
    return apiSuccess(order, "Order created successfully", 201);
  });
}
