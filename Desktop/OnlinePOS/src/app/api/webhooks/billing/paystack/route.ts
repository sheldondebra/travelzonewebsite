import { BillingPaymentStatus, BillingProvider } from "@/generated/prisma/client";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import {
  fulfillBillingPayment,
  listBillingProviderConfigs,
  markBillingPaymentFailed,
} from "@/server/services/billing/billing-service";
import { verifyPaystackWebhookSignature } from "@/server/services/payments/paystack-client";

type PaystackWebhook = {
  event?: string;
  data?: {
    reference?: string;
    status?: string;
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const providers = await listBillingProviderConfigs(false);
    const config = providers.find((row) => row.provider === BillingProvider.PAYSTACK);
    const secret = config?.webhookSecret || config?.secretKey;
    if (!secret) throw new Error("Paystack billing webhook is not configured");
    if (
      !verifyPaystackWebhookSignature(
        rawBody,
        request.headers.get("x-paystack-signature"),
        secret,
      )
    ) {
      throw new Error("Invalid Paystack webhook signature");
    }

    const payload = JSON.parse(rawBody) as PaystackWebhook;
    const reference = payload.data?.reference;
    if (!reference) throw new Error("Missing Paystack reference");

    if (payload.event === "charge.success" && payload.data?.status === "success") {
      await fulfillBillingPayment(reference, reference);
    } else if (payload.event?.startsWith("charge.")) {
      await markBillingPaymentFailed(
        reference,
        BillingPaymentStatus.DECLINED,
        payload.data?.status ?? "Paystack payment was not successful",
        reference,
      );
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
