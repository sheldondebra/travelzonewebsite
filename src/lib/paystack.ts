import { getPaystackSecretKey } from "@/lib/site-settings";

const PAYSTACK_BASE = "https://api.paystack.co";

type InitializeParams = {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number>;
};

type PaystackInitResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string;
    metadata?: Record<string, unknown>;
  };
};

async function secretKey() {
  const key = await getPaystackSecretKey();
  if (!key) throw new Error("Paystack secret key is not configured.");
  return key;
}

export function appUrl() {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function ghsToPesewas(amountGhs: number) {
  return Math.round(amountGhs * 100);
}

export async function initializePaystackTransaction(params: InitializeParams) {
  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountPesewas,
      reference: params.reference,
      currency: "GHS",
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });

  const data = (await response.json()) as PaystackInitResponse;
  if (!response.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || "Could not start Paystack payment.");
  }

  return data.data;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(
    `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${await secretKey()}`,
      },
      cache: "no-store",
    },
  );

  const data = (await response.json()) as PaystackVerifyResponse;
  if (!response.ok || !data.status || !data.data) {
    throw new Error(data.message || "Payment verification failed.");
  }

  return data.data;
}

export function pesewasToGhs(pesewas: number) {
  return pesewas / 100;
}

export async function verifyPaystackWebhookSignature(rawBody: string, signature: string | null) {
  const secret = await getPaystackSecretKey();
  if (!secret || !signature) return false;

  const { createHmac, timingSafeEqual } = await import("crypto");
  const hash = createHmac("sha512", secret).update(rawBody).digest("hex");

  try {
    const expected = Buffer.from(hash, "utf8");
    const received = Buffer.from(signature, "utf8");
    if (expected.length !== received.length) return false;
    return timingSafeEqual(expected, received);
  } catch {
    return false;
  }
}
