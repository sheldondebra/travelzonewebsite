import type { Prisma } from "@/generated/prisma/client";
import {
  getSmsPaymentConfig,
  isSmsPurchaseDevMode,
} from "@/lib/platform/sms-payments";
import { prisma } from "@/lib/prisma";
import {
  paystackInitialize,
  paystackVerify,
} from "@/server/services/payments/paystack-client";
import { creditSmsWallet } from "@/server/services/sms/sms-service";

function appBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function resolveBusinessPaymentEmail(businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      slug: true,
      users: {
        where: { role: "OWNER" },
        select: { email: true },
        take: 1,
      },
    },
  });
  if (!business) throw new Error("Business not found");
  return (
    business.users[0]?.email ?? `${business.slug.replace(/[^a-z0-9]/gi, "")}@sms.tecunit.local`
  );
}

export async function fulfillSmsPurchase(
  purchaseId: string,
  paymentReference: string,
  paymentMethod = "paystack",
  tx?: Prisma.TransactionClient,
) {
  const client = tx ?? prisma;

  const purchase = await client.smsPurchase.findUnique({
    where: { id: purchaseId },
  });
  if (!purchase) throw new Error("SMS purchase not found");
  if (purchase.paymentStatus === "PAID") {
    return { purchase, credited: 0, alreadyPaid: true };
  }

  await client.smsPurchase.update({
    where: { id: purchaseId },
    data: {
      paymentStatus: "PAID",
      paymentReference,
      paymentMethod,
    },
  });

  if (tx) {
    await client.businessSmsWallet.upsert({
      where: { businessId: purchase.businessId },
      create: { businessId: purchase.businessId, balance: purchase.smsCount },
      update: { balance: { increment: purchase.smsCount } },
    });
  } else {
    await creditSmsWallet(purchase.businessId, purchase.smsCount);
  }

  return { purchase, credited: purchase.smsCount, alreadyPaid: false };
}

export async function initiateSmsPurchase(businessId: string, packageId: string) {
  const pkg = await prisma.smsPackage.findFirst({
    where: { id: packageId, isActive: true },
  });
  if (!pkg) throw new Error("SMS package not found");

  const purchase = await prisma.smsPurchase.create({
    data: {
      businessId,
      packageId: pkg.id,
      smsCount: pkg.smsCount,
      amount: pkg.price,
      currency: pkg.currency,
      paymentStatus: "PENDING",
      paymentMethod: null,
      paymentReference: null,
    },
  });

  const paymentConfig = await getSmsPaymentConfig();
  const devInstant = isSmsPurchaseDevMode() && !paymentConfig.enabled;

  if (devInstant) {
    const result = await fulfillSmsPurchase(
      purchase.id,
      `DEV-${purchase.id}`,
      "dev_instant",
    );
    return {
      mode: "instant" as const,
      purchaseId: purchase.id,
      credited: result.credited,
    };
  }

  if (!paymentConfig.enabled) {
    await prisma.smsPurchase.update({
      where: { id: purchase.id },
      data: { paymentStatus: "FAILED" },
    });
    throw new Error(
      "SMS payments are not configured. General Office must set up Paystack.",
    );
  }

  const email = await resolveBusinessPaymentEmail(businessId);
  const reference = `sms_${purchase.id}`;
  const amountPesewas = Math.round(pkg.price * 100);

  const initialized = await paystackInitialize({
    secretKey: paymentConfig.secretKey,
    email,
    amountPesewas,
    currency: pkg.currency,
    reference,
    callbackUrl: `${appBaseUrl()}/dashboard/settings/sms?payment=success&reference=${reference}`,
    metadata: {
      type: "sms_purchase",
      purchaseId: purchase.id,
      businessId,
      packageId: pkg.id,
    },
  });

  await prisma.smsPurchase.update({
    where: { id: purchase.id },
    data: {
      paymentReference: initialized.reference,
      paymentMethod: "paystack",
    },
  });

  return {
    mode: "paystack" as const,
    purchaseId: purchase.id,
    reference: initialized.reference,
    authorizationUrl: initialized.authorization_url,
    publicKey: paymentConfig.publicKey,
  };
}

export async function verifyAndFulfillSmsPurchase(reference: string) {
  const purchase = await prisma.smsPurchase.findFirst({
    where: { paymentReference: reference },
  });
  if (!purchase) throw new Error("Purchase not found for this reference");
  if (purchase.paymentStatus === "PAID") {
    return { purchase, credited: 0, alreadyPaid: true };
  }

  const paymentConfig = await getSmsPaymentConfig();
  if (!paymentConfig.enabled) {
    throw new Error("SMS payments are not configured");
  }

  const verified = await paystackVerify({
    secretKey: paymentConfig.secretKey,
    reference,
  });

  if (verified.status !== "success") {
    await prisma.smsPurchase.update({
      where: { id: purchase.id },
      data: { paymentStatus: "FAILED" },
    });
    throw new Error("Payment was not successful");
  }

  const expectedAmount = Math.round(purchase.amount * 100);
  if (verified.amount !== expectedAmount) {
    throw new Error("Payment amount mismatch");
  }

  return fulfillSmsPurchase(purchase.id, reference, "paystack");
}

export async function handleSmsPaymentWebhook(
  rawBody: string,
  signature: string | null,
) {
  const paymentConfig = await getSmsPaymentConfig();
  const secret = paymentConfig.webhookSecret || paymentConfig.secretKey;

  const { verifyPaystackWebhookSignature } = await import(
    "@/server/services/payments/paystack-client"
  );

  if (!verifyPaystackWebhookSignature(rawBody, signature, secret)) {
    throw new Error("Invalid webhook signature");
  }

  const payload = JSON.parse(rawBody) as {
    event?: string;
    data?: {
      reference?: string;
      status?: string;
      metadata?: { purchaseId?: string; type?: string };
    };
  };

  if (payload.event !== "charge.success") {
    return { handled: false, reason: "Ignored event" };
  }

  const reference = payload.data?.reference;
  if (!reference) throw new Error("Missing payment reference");

  if (payload.data?.metadata?.type && payload.data.metadata.type !== "sms_purchase") {
    return { handled: false, reason: "Not an SMS purchase" };
  }

  const result = await verifyAndFulfillSmsPurchase(reference);
  return { handled: true, ...result };
}
