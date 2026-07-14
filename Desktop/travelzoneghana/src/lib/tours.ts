import {
  convertUsdToGhs,
  getConfiguredUsdToGhsRate,
  getUsdToGhsRateAsync,
} from "@/lib/currency";

export type Tour = {
  slug: string;
  title: string;
  tagline: string;
  location: string;
  duration: string;
  price: number;
  currency: "USD" | "GHS";
  priceNote: string;
  travelPeriod: string;
  image: string;
  gallery: string[];
  description: string;
  overview: string[];
  highlights: string[];
  included: string[];
  category: string;
};

export {
  getPublishedTours,
  getTourBySlug,
} from "@/lib/content-public";

export function formatPrice(amount: number, currency: "USD" | "GHS" = "GHS") {
  if (currency === "USD") {
    return `USD ${amount.toLocaleString()}`;
  }
  return `GHS ${amount.toLocaleString()}`;
}

/** Sync conversion using configured env rate (client initial render). */
export function getTourPaymentTotalGhs(
  tour: Tour,
  travelers: number,
  rate = getConfiguredUsdToGhsRate(),
) {
  const total = tour.price * travelers;
  if (tour.currency === "GHS") return total;
  return convertUsdToGhs(total, rate);
}

/** Server-side conversion with live/cached exchange rate for Paystack. */
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

export function formatTourPrice(tour: Tour) {
  return `${formatPrice(tour.price, tour.currency)} ${tour.priceNote}`;
}
