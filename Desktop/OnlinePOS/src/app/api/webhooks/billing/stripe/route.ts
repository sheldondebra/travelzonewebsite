import { BillingPaymentStatus, BillingProvider } from "@/generated/prisma/client";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import {
  fulfillBillingPayment,
  listBillingProviderConfigs,
  markBillingPaymentFailed,
} from "@/server/services/billing/billing-service";
import { constructStripeWebhookEvent } from "@/server/services/payments/stripe-client";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const providers = await listBillingProviderConfigs(false);
    const config = providers.find((row) => row.provider === BillingProvider.STRIPE);
    if (!config?.secretKey || !config.webhookSecret) {
      throw new Error("Stripe billing webhook is not configured");
    }

    const event = constructStripeWebhookEvent({
      secretKey: config.secretKey,
      webhookSecret: config.webhookSecret,
      rawBody,
      signature: request.headers.get("stripe-signature"),
    });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const reference = session.client_reference_id;
      if (reference) await fulfillBillingPayment(reference, event.id);
    }

    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const reference = session.client_reference_id;
      if (reference) {
        await markBillingPaymentFailed(
          reference,
          BillingPaymentStatus.CANCELLED,
          "Stripe checkout expired",
          event.id,
        );
      }
    }

    return apiSuccess({ received: true });
  } catch (error) {
    return handleApiError(error);
  }
}
