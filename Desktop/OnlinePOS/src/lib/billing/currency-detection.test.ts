import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countryToCurrency,
  detectBillingCurrency,
  detectCountryFromLocale,
  detectCountryFromTimezone,
} from "@/lib/billing/currency-detection";

describe("billing currency detection", () => {
  it("maps Ghana to GHS", () => {
    assert.equal(countryToCurrency("gh"), "GHS");
  });

  it("detects country from locale region", () => {
    assert.equal(detectCountryFromLocale("en-US"), "US");
  });

  it("detects Ghana from Accra timezone", () => {
    assert.equal(detectCountryFromTimezone("Africa/Accra"), "GH");
  });

  it("returns an available detected currency", () => {
    const result = detectBillingCurrency({
      locale: "en-GB",
      availableCurrencies: ["GHS", "USD", "GBP"],
    });

    assert.deepEqual(result, { country: "GB", currency: "GBP", detected: true });
  });

  it("falls back when detected currency is not priced", () => {
    const result = detectBillingCurrency({
      locale: "en-US",
      availableCurrencies: ["GHS"],
    });

    assert.deepEqual(result, { country: "US", currency: "GHS", detected: false });
  });
});
