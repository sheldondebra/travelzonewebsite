"use client";

import { useEffect, useState } from "react";
import {
  buildPaymentConversion,
  formatExchangeRate,
  getConfiguredUsdToGhsRate,
  type ExchangeRateInfo,
} from "@/lib/currency";
import { formatPrice } from "@/lib/tours";

type CurrencyConverterProps = {
  usdTotal: number;
  perPersonUsd?: number;
  travelers?: number;
  tourCurrency?: "USD" | "GHS";
  compact?: boolean;
  onConversionChange?: (paymentGhs: number, rate: number) => void;
};

export function CurrencyConverter({
  usdTotal,
  perPersonUsd,
  travelers = 1,
  tourCurrency = "USD",
  compact = false,
  onConversionChange,
}: CurrencyConverterProps) {
  const [rateInfo, setRateInfo] = useState<ExchangeRateInfo>({
    rate: getConfiguredUsdToGhsRate(),
    source: "configured",
    updatedAt: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(tourCurrency === "USD");

  useEffect(() => {
    if (tourCurrency !== "USD") return;

    let cancelled = false;

    fetch("/api/exchange-rate")
      .then((res) => res.json())
      .then((data: ExchangeRateInfo) => {
        if (!cancelled && data.rate) {
          setRateInfo(data);
        }
      })
      .catch(() => {
        // Keep configured fallback rate.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tourCurrency]);

  const conversion = buildPaymentConversion(
    usdTotal,
    tourCurrency,
    rateInfo.rate,
    rateInfo.source,
  );

  useEffect(() => {
    onConversionChange?.(conversion.paymentGhs, conversion.rate);
  }, [conversion.paymentGhs, conversion.rate, onConversionChange]);

  if (tourCurrency === "GHS") {
    return (
      <div className={`rounded-xl border border-gray-200 bg-cream ${compact ? "px-4 py-3" : "p-4"}`}>
        <p className="text-xs font-semibold tracking-wide text-brand-red uppercase">
          Payment amount
        </p>
        <p className="mt-2 text-2xl font-semibold text-navy">
          {formatPrice(conversion.paymentGhs)}
        </p>
        <p className="mt-1 text-xs text-text-muted">Charged in Ghana Cedis via Paystack</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-gray-200 bg-white ${compact ? "px-4 py-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-brand-red uppercase">
          USD → GHS conversion
        </p>
        {loading && (
          <span className="text-[10px] text-text-muted">Updating rate…</span>
        )}
      </div>

      <div className="mt-3 space-y-2 text-sm">
        {perPersonUsd !== undefined && (
          <div className="flex items-center justify-between text-text-muted">
            <span>
              {formatPrice(perPersonUsd, "USD")} × {travelers}
            </span>
            <span>{formatPrice(usdTotal, "USD")}</span>
          </div>
        )}

        {!perPersonUsd && (
          <div className="flex items-center justify-between text-text-muted">
            <span>Package total (USD)</span>
            <span>{formatPrice(usdTotal, "USD")}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-text-muted">
          <span>Exchange rate</span>
          <span className="text-right text-xs">{formatExchangeRate(conversion.rate)}</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2">
          <span className="font-medium text-navy">You pay in Cedis</span>
          <span className="text-lg font-semibold text-brand-red">
            {formatPrice(conversion.paymentGhs)}
          </span>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-text-muted">
        Paystack checkout is in GHS (cedis) at{" "}
        {formatExchangeRate(conversion.rate)}. Final cedis amount is locked
        when you confirm payment.
      </p>
    </div>
  );
}
