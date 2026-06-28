export type ExchangeRateInfo = {
  rate: number;
  source: "live" | "configured";
  updatedAt: string;
};

let cachedRate: (ExchangeRateInfo & { expiresAt: number }) | null = null;

const CACHE_MS = 60 * 60 * 1000;

/** Rate from env — available on client and server without fetching. */
export function getConfiguredUsdToGhsRate() {
  return Number(
    process.env.NEXT_PUBLIC_USD_TO_GHS_RATE ??
      process.env.USD_TO_GHS_RATE ??
      "15.5",
  );
}

async function fetchLiveUsdToGhsRate(): Promise<number | null> {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD", {
      next: { revalidate: 3600 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      result?: string;
      rates?: { GHS?: number };
    };

    if (data.result !== "success") return null;

    const rate = data.rates?.GHS;

    if (!rate || !Number.isFinite(rate) || rate <= 0) return null;
    return rate;
  } catch {
    return null;
  }
}

/** USD → GHS rate for checkout. Uses configured business rate unless USE_LIVE_EXCHANGE_RATE=true. */
export async function getUsdToGhsRateAsync(): Promise<ExchangeRateInfo> {
  const configured = getConfiguredUsdToGhsRate();
  const useLive = process.env.USE_LIVE_EXCHANGE_RATE === "true";

  if (!useLive) {
    return {
      rate: configured,
      source: "configured",
      updatedAt: new Date().toISOString(),
    };
  }

  if (cachedRate && Date.now() < cachedRate.expiresAt) {
    return {
      rate: cachedRate.rate,
      source: cachedRate.source,
      updatedAt: cachedRate.updatedAt,
    };
  }

  const live = await fetchLiveUsdToGhsRate();
  const rate = live ?? configured;
  const source = live ? ("live" as const) : ("configured" as const);
  const updatedAt = new Date().toISOString();

  cachedRate = {
    rate,
    source,
    updatedAt,
    expiresAt: Date.now() + CACHE_MS,
  };

  return { rate, source, updatedAt };
}

export function convertUsdToGhs(usdAmount: number, rate: number) {
  return Math.round(usdAmount * rate);
}

export function formatExchangeRate(rate: number) {
  return `1 USD = GHS ${rate.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export type PaymentConversion = {
  packageUsd: number;
  paymentGhs: number;
  rate: number;
  source: ExchangeRateInfo["source"];
};

export function buildPaymentConversion(
  packageUsd: number,
  tourCurrency: "USD" | "GHS",
  rate: number,
  source: ExchangeRateInfo["source"] = "configured",
): PaymentConversion {
  if (tourCurrency === "GHS") {
    return {
      packageUsd,
      paymentGhs: Math.round(packageUsd),
      rate: 1,
      source: "configured",
    };
  }

  return {
    packageUsd,
    paymentGhs: convertUsdToGhs(packageUsd, rate),
    rate,
    source,
  };
}
