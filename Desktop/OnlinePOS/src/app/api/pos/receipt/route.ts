import { buildReceiptModel } from "@/lib/receipt/build-receipt";
import { DEFAULT_SETTINGS } from "@/lib/settings/defaults";
import { getReceiptData } from "@/server/services/order/get-receipt";
import { sendOrderReceiptNotifications } from "@/server/services/notifications/send-order-receipt";
import { getBusinessSettings } from "@/server/services/settings/business-settings";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";
import { NotFoundError } from "@/server/utils/errors";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");
    if (!orderId) throw new NotFoundError("Order id required");

    const [order, settingsRow] = await Promise.all([
      getReceiptData(businessId, orderId),
      getBusinessSettings(businessId),
    ]);
    const receipt = buildReceiptModel(
      order,
      settingsRow?.settings.posReceipt ?? DEFAULT_SETTINGS.posReceipt,
    );
    return apiSuccess({ receipt, order }, "POS receipt loaded");
  });
}

export async function POST(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = (await request.json().catch(() => ({}))) as {
      orderId?: string;
      forceSms?: boolean;
      forceEmail?: boolean;
    };
    if (!body.orderId) throw new NotFoundError("Order id required");

    const receiptDelivery = await sendOrderReceiptNotifications(
      businessId,
      body.orderId,
      {
        forceSms: body.forceSms ?? true,
        forceEmail: body.forceEmail ?? true,
      },
    );
    return apiSuccess(receiptDelivery, "Receipt sent");
  });
}
