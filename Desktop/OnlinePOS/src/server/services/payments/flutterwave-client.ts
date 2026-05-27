import crypto from "crypto";

type FlutterwaveInitResponse = {
  status: string;
  message: string;
  data?: {
    link: string;
  };
};

type FlutterwaveVerifyResponse = {
  status: string;
  message: string;
  data?: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    status: string;
    amount: number;
    currency: string;
    meta?: Record<string, unknown>;
  };
};

export async function flutterwaveInitialize(input: {
  secretKey: string;
  txRef: string;
  amount: number;
  currency: string;
  email: string;
  name?: string | null;
  redirectUrl: string;
  metadata: Record<string, unknown>;
}) {
  const res = await fetch("https://api.flutterwave.com/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tx_ref: input.txRef,
      amount: input.amount,
      currency: input.currency,
      redirect_url: input.redirectUrl,
      customer: {
        email: input.email,
        name: input.name ?? input.email,
      },
      customizations: {
        title: "OnlinePOS Subscription",
      },
      meta: input.metadata,
    }),
  });

  const json = (await res.json()) as FlutterwaveInitResponse;
  if (!res.ok || json.status !== "success" || !json.data?.link) {
    throw new Error(json.message || "Flutterwave initialization failed");
  }
  return json.data;
}

export async function flutterwaveVerify(input: {
  secretKey: string;
  transactionId: string;
}) {
  const res = await fetch(
    `https://api.flutterwave.com/v3/transactions/${encodeURIComponent(input.transactionId)}/verify`,
    {
      headers: { Authorization: `Bearer ${input.secretKey}` },
    },
  );

  const json = (await res.json()) as FlutterwaveVerifyResponse;
  if (!res.ok || json.status !== "success" || !json.data) {
    throw new Error(json.message || "Flutterwave verification failed");
  }
  return json.data;
}

export function verifyFlutterwaveWebhookSignature(input: {
  rawBody: string;
  signature: string | null;
  secretHash: string;
}) {
  if (!input.signature || !input.secretHash) return false;
  const hmac = crypto
    .createHmac("sha256", input.secretHash)
    .update(input.rawBody)
    .digest("hex");
  return hmac === input.signature || input.signature === input.secretHash;
}
