const COUNTRY_TO_CURRENCY: Record<string, string> = {
  GH: "GHS",
  NG: "NGN",
  US: "USD",
  CA: "USD",
  GB: "GBP",
  UK: "GBP",
  EU: "EUR",
  FR: "EUR",
  DE: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  BE: "EUR",
  KE: "GHS",
  UG: "GHS",
  TZ: "GHS",
  ZA: "GHS",
};

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  "Africa/Accra": "GH",
  "Africa/Lagos": "NG",
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Amsterdam": "NL",
};

export function countryToCurrency(country: string | null | undefined) {
  if (!country) return null;
  return COUNTRY_TO_CURRENCY[country.trim().toUpperCase()] ?? null;
}

export function detectCountryFromLocale(locale: string | null | undefined) {
  if (!locale) return null;
  const region = locale.split("-")[1];
  return region ? region.toUpperCase() : null;
}

export function detectCountryFromTimezone(timeZone: string | null | undefined) {
  if (!timeZone) return null;
  return TIMEZONE_TO_COUNTRY[timeZone] ?? null;
}

export function detectBillingCurrency(input: {
  locale?: string | null;
  timeZone?: string | null;
  availableCurrencies: string[];
  fallback?: string;
}) {
  const available = new Set(input.availableCurrencies.map((value) => value.toUpperCase()));
  const country =
    detectCountryFromLocale(input.locale) ?? detectCountryFromTimezone(input.timeZone);
  const detected = countryToCurrency(country);
  const fallback = input.fallback ?? "GHS";

  if (detected && available.has(detected)) {
    return { country, currency: detected, detected: true };
  }
  if (available.has(fallback)) {
    return { country, currency: fallback, detected: false };
  }
  return {
    country,
    currency: input.availableCurrencies[0]?.toUpperCase() ?? fallback,
    detected: false,
  };
}
