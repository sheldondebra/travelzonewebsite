import { addDays, addMonths, addYears } from "date-fns";
import {
  BillingInterval,
  BillingPaymentStatus,
  BillingProvider,
  BillingSubscriptionStatus,
  Prisma,
  type BillingCoupon,
  type BillingPlanPrice,
  type BillingProviderConfig,
} from "@/generated/prisma/client";
import {
  amountToMinorUnits,
  calculateBillingCheckout,
  findBillingPrice,
  selectBillingProvider,
  type BillingCouponInput,
} from "@/lib/billing/calculate";
import { DEFAULT_BILLING_PLANS } from "@/lib/billing/default-plans";
import { prisma } from "@/lib/prisma";
import { maskSecret, mergeSecret } from "@/lib/platform/secrets";
import { paystackInitialize, paystackVerify } from "@/server/services/payments/paystack-client";
import {
  createStripeCheckoutSession,
  createStripeClient,
} from "@/server/services/payments/stripe-client";
import {
  flutterwaveInitialize,
  flutterwaveVerify,
} from "@/server/services/payments/flutterwave-client";

type ProviderConfigPatch = Partial<
  Pick<
    BillingProviderConfig,
    | "enabled"
    | "publicKey"
    | "secretKey"
    | "webhookSecret"
    | "testMode"
    | "supportedCurrencies"
    | "defaultForCurrencies"
  >
>;

function appBaseUrl() {
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

function billingReference() {
  return `bill_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function seedDefaultBillingData() {
  for (const plan of DEFAULT_BILLING_PLANS) {
    const row = await prisma.billingPlan.upsert({
      where: { slug: plan.slug },
      create: {
        slug: plan.slug,
        name: plan.name,
        description: plan.description,
        plan: plan.plan,
        features: plan.features,
        comparison: plan.comparison,
        isPopular: plan.isPopular ?? false,
        sortOrder: plan.sortOrder,
      },
      update: {
        name: plan.name,
        description: plan.description,
        plan: plan.plan,
        features: plan.features,
        comparison: plan.comparison,
        isPopular: plan.isPopular ?? false,
        sortOrder: plan.sortOrder,
        isActive: true,
      },
    });

    for (const price of plan.prices) {
      await prisma.billingPlanPrice.upsert({
        where: {
          planId_interval_currency: {
            planId: row.id,
            interval: price.interval,
            currency: price.currency,
          },
        },
        create: {
          planId: row.id,
          interval: price.interval,
          currency: price.currency,
          amount: price.amount,
        },
        update: { amount: price.amount },
      });
    }
  }

  await Promise.all(
    [
      {
        provider: BillingProvider.STRIPE,
        supportedCurrencies: ["USD", "EUR", "GBP"],
        defaultForCurrencies: ["USD", "EUR", "GBP"],
        publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      {
        provider: BillingProvider.PAYSTACK,
        supportedCurrencies: ["GHS", "NGN"],
        defaultForCurrencies: ["GHS"],
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? process.env.PAYSTACK_PUBLIC_KEY,
        secretKey: process.env.PAYSTACK_SECRET_KEY,
        webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET,
      },
      {
        provider: BillingProvider.FLUTTERWAVE,
        supportedCurrencies: ["GHS", "NGN", "KES", "UGX", "TZS", "ZAR"],
        defaultForCurrencies: [],
        publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
        webhookSecret: process.env.FLUTTERWAVE_SECRET_HASH,
      },
    ].map((config) =>
      prisma.billingProviderConfig.upsert({
        where: { provider: config.provider },
        create: {
          provider: config.provider,
          enabled: Boolean(config.secretKey && config.publicKey),
          publicKey: config.publicKey ?? "",
          secretKey: config.secretKey ?? "",
          webhookSecret: config.webhookSecret ?? "",
          supportedCurrencies: config.supportedCurrencies,
          defaultForCurrencies: config.defaultForCurrencies,
        },
        update: {},
      }),
    ),
  );
}

export async function listBillingPlans(includeInactive = false) {
  await seedDefaultBillingData();
  return prisma.billingPlan.findMany({
    where: includeInactive ? undefined : { isActive: true },
    include: { prices: { orderBy: [{ currency: "asc" }, { interval: "asc" }] } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function listBillingProviderConfigs(mask = true) {
  await seedDefaultBillingData();
  const rows = await prisma.billingProviderConfig.findMany({
    orderBy: { provider: "asc" },
  });
  return mask
    ? rows.map((row) => ({
        ...row,
        secretKey: maskSecret(row.secretKey),
        webhookSecret: maskSecret(row.webhookSecret),
      }))
    : rows;
}

export async function saveBillingProviderConfig(
  provider: BillingProvider,
  patch: ProviderConfigPatch,
) {
  const current = await prisma.billingProviderConfig.findUnique({
    where: { provider },
  });
  return prisma.billingProviderConfig.upsert({
    where: { provider },
    create: {
      provider,
      enabled: patch.enabled ?? false,
      publicKey: patch.publicKey ?? "",
      secretKey: patch.secretKey ?? "",
      webhookSecret: patch.webhookSecret ?? "",
      testMode: patch.testMode ?? true,
      supportedCurrencies: patch.supportedCurrencies ?? [],
      defaultForCurrencies: patch.defaultForCurrencies ?? [],
    },
    update: {
      enabled: patch.enabled,
      publicKey: patch.publicKey,
      secretKey: mergeSecret(patch.secretKey ?? undefined, current?.secretKey ?? undefined),
      webhookSecret: mergeSecret(
        patch.webhookSecret ?? undefined,
        current?.webhookSecret ?? undefined,
      ),
      testMode: patch.testMode,
      supportedCurrencies: patch.supportedCurrencies,
      defaultForCurrencies: patch.defaultForCurrencies,
    },
  });
}

export async function createBillingCheckout(input: {
  businessId: string;
  email: string;
  customerName?: string | null;
  planId: string;
  interval: BillingInterval;
  currency: string;
  couponCode?: string | null;
  country?: string | null;
  provider?: BillingProvider | null;
}) {
  await seedDefaultBillingData();
  const plan = await prisma.billingPlan.findFirst({
    where: { id: input.planId, isActive: true },
    include: { prices: true },
  });
  if (!plan) throw new Error("Billing plan not found");

  const price = findBillingPrice(
    plan.prices.map(priceToInput),
    input.interval,
    input.currency,
  );
  if (!price) throw new Error("This plan is not available for that currency/interval");

  const coupon = input.couponCode
    ? await prisma.billingCoupon.findUnique({
        where: { code: input.couponCode.trim().toUpperCase() },
      })
    : null;

  const calculation = calculateBillingCheckout({
    price,
    coupon: couponToInput(coupon),
    planId: plan.id,
  });
  const selectedProvider =
    calculation.totalAmount === 0
      ? BillingProvider.MANUAL
      : input.provider ??
        (selectBillingProvider({
          currency: input.currency,
          country: input.country,
        }) as BillingProvider);

  const reference = billingReference();
  const payment = await prisma.billingPayment.create({
    data: {
      businessId: input.businessId,
      planId: plan.id,
      couponId: coupon?.id,
      provider: selectedProvider,
      interval: input.interval,
      currency: input.currency.toUpperCase(),
      subtotalAmount: calculation.subtotalAmount,
      discountAmount: calculation.discountAmount,
      totalAmount: calculation.totalAmount,
      providerReference: reference,
      status: BillingPaymentStatus.PENDING,
      paidAt: null,
      metadata: { source: "billing_checkout" },
    },
  });

  if (selectedProvider === BillingProvider.MANUAL) {
    await fulfillBillingPayment(reference);
    return {
      paymentId: payment.id,
      reference,
      provider: selectedProvider,
      checkoutUrl: `${appBaseUrl()}/dashboard/settings/billing?payment=success&reference=${reference}`,
    };
  }

  const config = await getEnabledProviderConfig(selectedProvider);
  const checkout = await initializeProviderCheckout({
    provider: selectedProvider,
    config,
    reference,
    email: input.email,
    customerName: input.customerName,
    amount: calculation.totalAmount,
    currency: input.currency.toUpperCase(),
    planName: plan.name,
    businessId: input.businessId,
    paymentId: payment.id,
  });

  await prisma.billingPayment.update({
    where: { id: payment.id },
    data: { checkoutUrl: checkout.checkoutUrl },
  });

  return {
    paymentId: payment.id,
    reference,
    provider: selectedProvider,
    checkoutUrl: checkout.checkoutUrl,
  };
}

export async function fulfillBillingPayment(reference: string, providerEventId?: string) {
  const payment = await prisma.billingPayment.findUnique({
    where: { providerReference: reference },
    include: { plan: true, coupon: true },
  });
  if (!payment) throw new Error("Billing payment not found");
  if (payment.status === BillingPaymentStatus.SUCCEEDED && payment.subscriptionId) {
    return payment;
  }

  const now = new Date();
  const periodEnd =
    payment.plan.plan === "FREE"
      ? addDays(now, 14)
      : payment.interval === BillingInterval.YEARLY
        ? addYears(now, 1)
        : addMonths(now, 1);

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.billingSubscription.upsert({
      where: { businessId: payment.businessId },
      create: {
        businessId: payment.businessId,
        planId: payment.planId,
        interval: payment.interval,
        currency: payment.currency,
        provider: payment.provider,
        status: BillingSubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: payment.planId,
        interval: payment.interval,
        currency: payment.currency,
        provider: payment.provider,
        status: BillingSubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelledAt: null,
        cancelAt: null,
      },
    });

    const updatedPayment = await tx.billingPayment.update({
      where: { id: payment.id },
      data: {
        status: BillingPaymentStatus.SUCCEEDED,
        paidAt: now,
        providerEventId,
        subscriptionId: subscription.id,
      },
    });

    if (payment.couponId && payment.discountAmount > 0) {
      await tx.billingCoupon.update({
        where: { id: payment.couponId },
        data: { redeemedCount: { increment: 1 } },
      });
      await tx.billingCouponRedemption.create({
        data: {
          couponId: payment.couponId,
          businessId: payment.businessId,
          paymentId: payment.id,
          discountAmount: payment.discountAmount,
        },
      });
    }

    await tx.business.update({
      where: { id: payment.businessId },
      data: { subscriptionPlan: payment.plan.plan },
    });

    return updatedPayment;
  });
}

export async function markBillingPaymentFailed(
  reference: string,
  status: "FAILED" | "DECLINED" | "CANCELLED",
  failureReason?: string,
  providerEventId?: string,
) {
  return prisma.billingPayment.update({
    where: { providerReference: reference },
    data: { status, failureReason, providerEventId },
  });
}

export async function verifyProviderPayment(input: {
  provider: BillingProvider;
  reference: string;
  transactionId?: string;
}) {
  const config = await getEnabledProviderConfig(input.provider);
  if (input.provider === BillingProvider.PAYSTACK) {
    const verified = await paystackVerify({
      secretKey: config.secretKey ?? "",
      reference: input.reference,
    });
    return verified.status === "success";
  }
  if (input.provider === BillingProvider.FLUTTERWAVE) {
    if (!input.transactionId) throw new Error("Missing Flutterwave transaction id");
    const verified = await flutterwaveVerify({
      secretKey: config.secretKey ?? "",
      transactionId: input.transactionId,
    });
    return verified.status === "successful" && verified.tx_ref === input.reference;
  }
  if (input.provider === BillingProvider.STRIPE) {
    const stripe = createStripeClient(config.secretKey ?? "");
    const session = await stripe.checkout.sessions.retrieve(input.reference);
    return session.payment_status === "paid";
  }
  return false;
}

async function getEnabledProviderConfig(provider: BillingProvider) {
  const config = await prisma.billingProviderConfig.findUnique({ where: { provider } });
  if (!config?.enabled || !config.secretKey) {
    throw new Error(`${provider.toLowerCase()} billing provider is not configured`);
  }
  return config;
}

async function initializeProviderCheckout(input: {
  provider: BillingProvider;
  config: BillingProviderConfig;
  reference: string;
  email: string;
  customerName?: string | null;
  amount: number;
  currency: string;
  planName: string;
  businessId: string;
  paymentId: string;
}) {
  const callbackBase = `${appBaseUrl()}/dashboard/settings/billing`;
  const metadata = {
    type: "subscription_billing",
    paymentId: input.paymentId,
    businessId: input.businessId,
    reference: input.reference,
  };

  if (input.provider === BillingProvider.STRIPE) {
    const session = await createStripeCheckoutSession({
      secretKey: input.config.secretKey ?? "",
      email: input.email,
      amountMinor: amountToMinorUnits(input.amount),
      currency: input.currency,
      productName: `OnlinePOS ${input.planName}`,
      successUrl: `${callbackBase}?payment=success&reference=${input.reference}`,
      cancelUrl: `${callbackBase}?payment=cancelled&reference=${input.reference}`,
      reference: input.reference,
      metadata,
    });
    return { checkoutUrl: session.url };
  }

  if (input.provider === BillingProvider.PAYSTACK) {
    const tx = await paystackInitialize({
      secretKey: input.config.secretKey ?? "",
      email: input.email,
      amountPesewas: amountToMinorUnits(input.amount),
      currency: input.currency,
      reference: input.reference,
      callbackUrl: `${callbackBase}?payment=success&reference=${input.reference}`,
      metadata,
    });
    return { checkoutUrl: tx.authorization_url };
  }

  const tx = await flutterwaveInitialize({
    secretKey: input.config.secretKey ?? "",
    txRef: input.reference,
    amount: input.amount,
    currency: input.currency,
    email: input.email,
    name: input.customerName,
    redirectUrl: `${callbackBase}?payment=success&reference=${input.reference}`,
    metadata,
  });
  return { checkoutUrl: tx.link };
}

function priceToInput(price: BillingPlanPrice) {
  return {
    interval: price.interval,
    currency: price.currency,
    amount: price.amount,
  };
}

function couponToInput(coupon: BillingCoupon | null): BillingCouponInput | null {
  if (!coupon) return null;
  return {
    code: coupon.code,
    discountType: coupon.discountType === "FIXED" ? "FIXED" : "PERCENT",
    discountValue: coupon.discountValue,
    isActive: coupon.isActive,
    redeemedCount: coupon.redeemedCount,
    maxRedemptions: coupon.maxRedemptions,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    applicablePlanId: coupon.applicablePlanId,
    applicableCurrency: coupon.applicableCurrency,
    applicableInterval: coupon.applicableInterval,
  };
}

export type BillingPlanWithPrices = Prisma.BillingPlanGetPayload<{
  include: { prices: true };
}>;
