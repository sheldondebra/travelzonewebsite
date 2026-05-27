import { BillingPaymentStatus, BillingProvider } from "@/generated/prisma/client";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import {
  fulfillBillingPayment,
  listBillingProviderConfigs,
  markBillingPaymentFailed,
} from "@/server/services/billing/billing-service";
import { verifyFlutterwaveWebhookSignature } from "@/server/services/payments/flutterwave-client";

type FlutterwaveWebhook = {
  event?: string;
  data?: {
    tx_ref?: string;
    status?: string;
    id?: number;
  };
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const providers = await listBillingProviderConfigs(false);
    const config = providers.find((row) => row.provider === BillingProvider.FLUTTERWAVE);
    if (!config?.webhookSecret) {
      throw new Error("Flutterwave billing webhook is not configured");
    }
    if (
      !verifyFlutterwaveWebhookSignature({
        rawBody,
        signature: request.headers.get("verif-hash"),
        secretHash: config.webhookSecret,
      })
    ) {
      throw new Error("Invalid Flutterwave webhook signature");
    }

    const payload = JSON.parse(rawBody) as FlutterwaveWebhook;
    const reference = payload.data?.tx_ref;
    if (!reference) throw new Error("Missing Flutterwave reference");

    if (payload.event === "charge.completed" && payload.data?.status === "successful") {
      await fulfillBillingPayment(reference, String(payload.data.id ?? reference));
    } else if (payload.event?.startsWith("charge.")) {
      await markBillingPaymentFailed(
        reference,
        BillingPaymentStatus.DECLINED,
        payload.data?.status ?? "Flutterwave payment was not successful",
        String(payload.data?.id ?? reference),
      );
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
