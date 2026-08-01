export type ExchangeRateInfo = {
  rate: number;
  source: "live" | "configured";
  updatedAt: string;
};

export type ExchangeRateOptions = {
  usdToGhs: number;
  useLive: boolean;
};

let cachedRate: (ExchangeRateInfo & { expiresAt: number }) | null = null;

const CACHE_MS = 60 * 60 * 1000;

/** Sync env fallback for client initial render before /api/exchange-rate returns. */
export function getConfiguredUsdToGhsRate() {
  const rate = Number(
    process.env.NEXT_PUBLIC_USD_TO_GHS_RATE ??
      process.env.USD_TO_GHS_RATE ??
      "15.5",
  );
  return Number.isFinite(rate) && rate > 0 ? rate : 15.5;
}

export function clearExchangeRateCache() {
  cachedRate = null;
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

/**
 * Resolve USD → GHS for checkout. Pass admin settings when available;
 * otherwise falls back to env defaults.
 */
export async function resolveUsdToGhsRate(
  options?: Partial<ExchangeRateOptions> | null,
): Promise<ExchangeRateInfo> {
  const configuredRaw = Number(options?.usdToGhs);
  const configured =
    Number.isFinite(configuredRaw) && configuredRaw > 0
      ? configuredRaw
      : getConfiguredUsdToGhsRate();
  const useLive =
    options?.useLive ?? process.env.USE_LIVE_EXCHANGE_RATE === "true";

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
