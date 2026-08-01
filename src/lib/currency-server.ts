import "server-only";

import { convertUsdToGhs, resolveUsdToGhsRate, type ExchangeRateInfo } from "@/lib/currency";
import { getExchangeRateSettings } from "@/lib/site-settings";
import type { Tour } from "@/lib/tours";

/** Server-only: load admin dollar-rate settings, then resolve USD → GHS. */
export async function getUsdToGhsRateAsync(): Promise<ExchangeRateInfo> {
  const settings = await getExchangeRateSettings();
  return resolveUsdToGhsRate(settings);
}

/** Server-side conversion with admin/live exchange rate for Paystack. */
export async function getTourPaymentTotalGhsAsync(tour: Tour, travelers: number) {
  const total = tour.price * travelers;
  if (tour.currency === "GHS") {
    return { paymentGhs: total, rate: 1, source: "configured" as const };
  }

  const { rate, source } = await getUsdToGhsRateAsync();
  return {
    paymentGhs: convertUsdToGhs(total, rate),
    rate,
    source,
    packageUsd: total,
  };
}
