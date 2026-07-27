"use client";

type OpenPaystackOptions = {
  accessCode: string;
  authorizationUrl: string;
  reference: string;
};

export async function openPaystackCheckout({
  accessCode,
  authorizationUrl,
  reference,
}: OpenPaystackOptions): Promise<void> {
  if (typeof window === "undefined") {
    throw new Error("Paystack checkout can only run in the browser.");
  }

  const PaystackPop = (await import("@paystack/inline-js")).default;
  const paystack = new PaystackPop();

  await new Promise<void>((resolve, reject) => {
    paystack.resumeTransaction(accessCode, {
      onSuccess: () => {
        window.location.href = `/booking/payment/verify?reference=${encodeURIComponent(reference)}`;
        resolve();
      },
      onCancel: () => {
        reject(new Error("Payment was cancelled. You can try again when ready."));
      },
      onError: () => {
        window.location.href = authorizationUrl;
        resolve();
      },
    });
  });
}
