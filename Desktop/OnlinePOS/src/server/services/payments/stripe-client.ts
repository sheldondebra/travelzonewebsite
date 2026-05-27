import Stripe from "stripe";

export function createStripeClient(secretKey: string) {
  if (!secretKey) throw new Error("Stripe secret key is not configured");
  return new Stripe(secretKey);
}

export async function createStripeCheckoutSession(input: {
  secretKey: string;
  email: string;
  amountMinor: number;
  currency: string;
  productName: string;
  successUrl: string;
  cancelUrl: string;
  reference: string;
  metadata: Record<string, string>;
}) {
  const stripe = createStripeClient(input.secretKey);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.email,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    client_reference_id: input.reference,
    metadata: input.metadata,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountMinor,
          product_data: { name: input.productName },
        },
      },
    ],
  });

  if (!session.url) throw new Error("Stripe checkout URL was not returned");
  return {
    id: session.id,
    url: session.url,
  };
}

export function constructStripeWebhookEvent(input: {
  secretKey: string;
  webhookSecret: string;
  rawBody: string;
  signature: string | null;
}) {
  if (!input.signature) throw new Error("Missing Stripe signature");
  const stripe = createStripeClient(input.secretKey);
  return stripe.webhooks.constructEvent(
    input.rawBody,
    input.signature,
    input.webhookSecret,
  );
}
