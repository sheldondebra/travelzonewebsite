import { createOrder } from "@/server/services/order/create-order";
import { resolvePosCashierId } from "@/server/services/pos/cashier";
import { getOpenRegisterSession } from "@/server/services/pos/register";
import { sendOrderReceiptNotifications } from "@/server/services/notifications/send-order-receipt";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessUserAuth, parseJsonBody } from "@/server/utils/with-auth";
import { createPosSaleSchema } from "@/server/validations/pos";
import { AppError } from "@/server/utils/errors";

export async function POST(request: Request) {
  return withBusinessUserAuth(request, async ({ businessId, userId }) => {
    const body = await parseJsonBody(request);
    const input = createPosSaleSchema.parse(body);

    const openSession = await getOpenRegisterSession(businessId);
    if (!openSession) {
      throw new AppError("Open the register before completing a sale", 409);
    }

    const cashierId = await resolvePosCashierId(
      request,
      businessId,
      userId,
      input.cashierToken,
    );

    const order = await createOrder(
      businessId,
      {
        ...input,
        registerSessionId: input.registerSessionId ?? openSession.id,
        notes: input.notes ?? "POS sale",
      },
      cashierId,
    );

    const receiptDelivery = await sendOrderReceiptNotifications(
      businessId,
      order.id,
    );

    return apiSuccess(
      { order, receiptDelivery, registerSessionId: openSession.id },
      "POS sale completed",
      201,
    );
  });
}
