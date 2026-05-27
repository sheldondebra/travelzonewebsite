import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  amountToMinorUnits,
  calculateBillingCheckout,
  calculateCouponDiscount,
  findBillingPrice,
  selectBillingProvider,
} from "@/lib/billing/calculate";

describe("billing calculation", () => {
  it("selects the requested interval and currency price", () => {
    const price = findBillingPrice(
      [
        { interval: "MONTHLY", currency: "GHS", amount: 99 },
        { interval: "YEARLY", currency: "USD", amount: 199 },
      ],
      "YEARLY",
      "usd",
    );

    assert.equal(price?.amount, 199);
  });

  it("applies percentage coupons within their constraints", () => {
    const discount = calculateCouponDiscount({
      subtotalAmount: 200,
      planId: "plan-pro",
      interval: "YEARLY",
      currency: "USD",
      now: new Date("2026-05-27T00:00:00Z"),
      coupon: {
        code: "SAVE25",
        discountType: "PERCENT",
        discountValue: 25,
        isActive: true,
        redeemedCount: 0,
        applicablePlanId: "plan-pro",
        applicableCurrency: "USD",
        applicableInterval: "YEARLY",
      },
    });

    assert.equal(discount, 50);
  });

  it("ignores exhausted coupons", () => {
    const discount = calculateCouponDiscount({
      subtotalAmount: 100,
      planId: "plan-pro",
      interval: "MONTHLY",
      currency: "GHS",
      coupon: {
        code: "USEDUP",
        discountType: "FIXED",
        discountValue: 30,
        isActive: true,
        redeemedCount: 10,
        maxRedemptions: 10,
      },
    });

    assert.equal(discount, 0);
  });

  it("calculates checkout totals without going below zero", () => {
    const total = calculateBillingCheckout({
      planId: "plan-pro",
      price: { interval: "MONTHLY", currency: "GHS", amount: 20 },
      coupon: {
        code: "FREE",
        discountType: "FIXED",
        discountValue: 100,
        isActive: true,
        redeemedCount: 0,
      },
    });

    assert.deepEqual(total, {
      subtotalAmount: 20,
      discountAmount: 20,
      totalAmount: 0,
      couponCode: "FREE",
    });
  });
});

describe("billing provider routing", () => {
  it("routes Ghana/GHS payments to the configured local provider", () => {
    assert.equal(
      selectBillingProvider({
        currency: "GHS",
        country: "GH",
        localProvider: "FLUTTERWAVE",
      }),
      "FLUTTERWAVE",
    );
  });

  it("routes international payments to Stripe", () => {
    assert.equal(selectBillingProvider({ currency: "USD", country: "US" }), "STRIPE");
  });

  it("converts major units to minor units", () => {
    assert.equal(amountToMinorUnits(12.34), 1234);
  });
});
