import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { handleSmsPaymentWebhook } from "@/server/services/sms/sms-purchase-service";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-paystack-signature");
    const result = await handleSmsPaymentWebhook(rawBody, signature);
    return apiSuccess(result);
  } catch (e) {
    return handleApiError(e);
  }
}
