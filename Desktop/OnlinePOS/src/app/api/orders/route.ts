import { createOrder } from "@/server/services/order/create-order";
import { listOrders } from "@/server/services/order/list-orders";
import { sendOrderReceiptNotifications } from "@/server/services/notifications/send-order-receipt";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";
import { createOrderSchema, orderFiltersSchema } from "@/server/validations/order";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const filters = orderFiltersSchema.parse({
      search: searchParams.get("search") ?? undefined,
      paymentStatus: searchParams.get("paymentStatus") ?? undefined,
      deliveryStatus: searchParams.get("deliveryStatus") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    });
    const result = await listOrders(businessId, filters);
    return apiSuccess(result, "Orders fetched successfully");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = await parseJsonBody(request);
    const input = createOrderSchema.parse(body);
    const order = await createOrder(businessId, input);
    const receiptDelivery = await sendOrderReceiptNotifications(
      businessId,
      order.id,
    );
    return apiSuccess(
      { order, receiptDelivery },
      "Order created successfully",
      201,
    );
  });
}
