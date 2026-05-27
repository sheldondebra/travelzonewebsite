import { buildReceiptModel } from "@/lib/receipt/build-receipt";
import { DEFAULT_SETTINGS } from "@/lib/settings/defaults";
import { getReceiptData } from "@/server/services/order/get-receipt";
import { sendOrderReceiptNotifications } from "@/server/services/notifications/send-order-receipt";
import { getBusinessSettings } from "@/server/services/settings/business-settings";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth } from "@/server/utils/with-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const [order, settingsRow] = await Promise.all([
      getReceiptData(businessId, id),
      getBusinessSettings(businessId),
    ]);
    const receipt = buildReceiptModel(
      order,
      settingsRow?.settings.posReceipt ?? DEFAULT_SETTINGS.posReceipt,
    );
    return apiSuccess({ receipt, order }, "Receipt loaded");
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const body = (await request.json().catch(() => ({}))) as {
      forceSms?: boolean;
      forceEmail?: boolean;
    };
    const receiptDelivery = await sendOrderReceiptNotifications(
      businessId,
      id,
      {
        forceSms: body.forceSms ?? true,
        forceEmail: body.forceEmail ?? true,
      },
    );
    return apiSuccess(receiptDelivery, "Receipt notifications sent");
  });
}
