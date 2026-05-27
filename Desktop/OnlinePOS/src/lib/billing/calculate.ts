export type BillingIntervalValue = "MONTHLY" | "YEARLY";
export type BillingProviderValue = "STRIPE" | "PAYSTACK" | "FLUTTERWAVE" | "MANUAL";

export type BillingPriceInput = {
  interval: BillingIntervalValue;
  currency: string;
  amount: number;
};

export type BillingCouponInput = {
  code: string;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  isActive: boolean;
  redeemedCount: number;
  maxRedemptions?: number | null;
  validFrom?: Date | null;
  validUntil?: Date | null;
  applicablePlanId?: string | null;
  applicableCurrency?: string | null;
  applicableInterval?: BillingIntervalValue | null;
};

export type BillingCheckoutCalculation = {
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string;
};

export function findBillingPrice(
  prices: BillingPriceInput[],
  interval: BillingIntervalValue,
  currency: string,
) {
  const normalizedCurrency = currency.toUpperCase();
  return prices.find(
    (price) =>
      price.interval === interval &&
      price.currency.toUpperCase() === normalizedCurrency,
  );
}

export function calculateCouponDiscount(input: {
  subtotalAmount: number;
  coupon?: BillingCouponInput | null;
  planId: string;
  interval: BillingIntervalValue;
  currency: string;
  now?: Date;
}) {
  const { subtotalAmount, coupon, planId, interval, currency } = input;
  if (!coupon) return 0;
  const now = input.now ?? new Date();
  const normalizedCurrency = currency.toUpperCase();

  if (!coupon.isActive) return 0;
  if (coupon.maxRedemptions != null && coupon.redeemedCount >= coupon.maxRedemptions) {
    return 0;
  }
  if (coupon.validFrom && coupon.validFrom > now) return 0;
  if (coupon.validUntil && coupon.validUntil < now) return 0;
  if (coupon.applicablePlanId && coupon.applicablePlanId !== planId) return 0;
  if (
    coupon.applicableCurrency &&
    coupon.applicableCurrency.toUpperCase() !== normalizedCurrency
  ) {
    return 0;
  }
  if (coupon.applicableInterval && coupon.applicableInterval !== interval) return 0;

  const raw =
    coupon.discountType === "PERCENT"
      ? subtotalAmount * (coupon.discountValue / 100)
      : coupon.discountValue;

  return Math.min(subtotalAmount, Math.max(0, roundMoney(raw)));
}

export function calculateBillingCheckout(input: {
  price: BillingPriceInput;
  coupon?: BillingCouponInput | null;
  planId: string;
  now?: Date;
}): BillingCheckoutCalculation {
  const subtotalAmount = roundMoney(input.price.amount);
  const discountAmount = calculateCouponDiscount({
    subtotalAmount,
    coupon: input.coupon,
    planId: input.planId,
    interval: input.price.interval,
    currency: input.price.currency,
    now: input.now,
  });

  return {
    subtotalAmount,
    discountAmount,
    totalAmount: roundMoney(subtotalAmount - discountAmount),
    couponCode: input.coupon?.code,
  };
}

export function selectBillingProvider(input: {
  currency: string;
  country?: string | null;
  localProvider?: Exclude<BillingProviderValue, "STRIPE" | "MANUAL">;
}): BillingProviderValue {
  const currency = input.currency.toUpperCase();
  const country = input.country?.toUpperCase();
  const localProvider = input.localProvider ?? "PAYSTACK";
  const localCurrencies = new Set(["GHS", "NGN", "KES", "UGX", "TZS", "ZAR"]);
  const localCountries = new Set(["GH", "NG", "KE", "UG", "TZ", "ZA"]);

  if (currency === "GHS" || country === "GH") return localProvider;
  if (localCurrencies.has(currency) || (country && localCountries.has(country))) {
    return localProvider;
  }

  return "STRIPE";
}

export function amountToMinorUnits(amount: number) {
  return Math.round(roundMoney(amount) * 100);
}

function roundMoney(amount: number) {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}
