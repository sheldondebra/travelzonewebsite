-- SaaS billing: plans, prices, coupons, subscriptions, payments, providers

CREATE TYPE "BillingInterval" AS ENUM ('MONTHLY', 'YEARLY');
CREATE TYPE "BillingProvider" AS ENUM ('STRIPE', 'PAYSTACK', 'FLUTTERWAVE', 'MANUAL');
CREATE TYPE "BillingPaymentStatus" AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'DECLINED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "BillingSubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED');

CREATE TABLE "BillingPlan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'PRO',
    "features" JSONB,
    "comparison" JSONB,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingPlanPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "providerPriceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPlanPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingCoupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxRedemptions" INTEGER,
    "redeemedCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicablePlanId" TEXT,
    "applicableCurrency" TEXT,
    "applicableInterval" "BillingInterval",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingCoupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingSubscription" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "status" "BillingSubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "providerSubscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingSubscription_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingPayment" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "planId" TEXT NOT NULL,
    "couponId" TEXT,
    "provider" "BillingProvider" NOT NULL,
    "interval" "BillingInterval" NOT NULL,
    "currency" TEXT NOT NULL,
    "subtotalAmount" DOUBLE PRECISION NOT NULL,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BillingPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "providerReference" TEXT,
    "providerEventId" TEXT,
    "checkoutUrl" TEXT,
    "failureReason" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingPayment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingCouponRedemption" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "paymentId" TEXT,
    "discountAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingCouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BillingProviderConfig" (
    "id" TEXT NOT NULL,
    "provider" "BillingProvider" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "publicKey" TEXT,
    "secretKey" TEXT,
    "webhookSecret" TEXT,
    "testMode" BOOLEAN NOT NULL DEFAULT true,
    "supportedCurrencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultForCurrencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingProviderConfig_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BillingPlan_slug_key" ON "BillingPlan"("slug");
CREATE INDEX "BillingPlan_isActive_idx" ON "BillingPlan"("isActive");
CREATE INDEX "BillingPlan_sortOrder_idx" ON "BillingPlan"("sortOrder");

CREATE UNIQUE INDEX "BillingPlanPrice_planId_interval_currency_key" ON "BillingPlanPrice"("planId", "interval", "currency");
CREATE INDEX "BillingPlanPrice_currency_idx" ON "BillingPlanPrice"("currency");
CREATE INDEX "BillingPlanPrice_interval_idx" ON "BillingPlanPrice"("interval");

CREATE UNIQUE INDEX "BillingCoupon_code_key" ON "BillingCoupon"("code");
CREATE INDEX "BillingCoupon_code_idx" ON "BillingCoupon"("code");
CREATE INDEX "BillingCoupon_isActive_idx" ON "BillingCoupon"("isActive");

CREATE UNIQUE INDEX "BillingSubscription_businessId_key" ON "BillingSubscription"("businessId");
CREATE INDEX "BillingSubscription_planId_idx" ON "BillingSubscription"("planId");
CREATE INDEX "BillingSubscription_status_idx" ON "BillingSubscription"("status");
CREATE INDEX "BillingSubscription_provider_idx" ON "BillingSubscription"("provider");

CREATE UNIQUE INDEX "BillingPayment_providerReference_key" ON "BillingPayment"("providerReference");
CREATE UNIQUE INDEX "BillingPayment_providerEventId_key" ON "BillingPayment"("providerEventId");
CREATE INDEX "BillingPayment_businessId_idx" ON "BillingPayment"("businessId");
CREATE INDEX "BillingPayment_subscriptionId_idx" ON "BillingPayment"("subscriptionId");
CREATE INDEX "BillingPayment_status_idx" ON "BillingPayment"("status");
CREATE INDEX "BillingPayment_provider_idx" ON "BillingPayment"("provider");
CREATE INDEX "BillingPayment_createdAt_idx" ON "BillingPayment"("createdAt");

CREATE INDEX "BillingCouponRedemption_couponId_idx" ON "BillingCouponRedemption"("couponId");
CREATE INDEX "BillingCouponRedemption_businessId_idx" ON "BillingCouponRedemption"("businessId");
CREATE INDEX "BillingCouponRedemption_paymentId_idx" ON "BillingCouponRedemption"("paymentId");

CREATE UNIQUE INDEX "BillingProviderConfig_provider_key" ON "BillingProviderConfig"("provider");

ALTER TABLE "BillingPlanPrice" ADD CONSTRAINT "BillingPlanPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCoupon" ADD CONSTRAINT "BillingCoupon_applicablePlanId_fkey" FOREIGN KEY ("applicablePlanId") REFERENCES "BillingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingSubscription" ADD CONSTRAINT "BillingSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "BillingSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "BillingPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BillingPayment" ADD CONSTRAINT "BillingPayment_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BillingCoupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "BillingCoupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BillingCouponRedemption" ADD CONSTRAINT "BillingCouponRedemption_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BillingPayment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
