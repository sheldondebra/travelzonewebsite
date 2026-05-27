import type { BillingIntervalValue } from "@/lib/billing/calculate";

export type DefaultBillingPrice = {
  interval: BillingIntervalValue;
  currency: string;
  amount: number;
};

export type DefaultBillingPlan = {
  slug: string;
  name: string;
  description: string;
  plan: "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
  isPopular?: boolean;
  sortOrder: number;
  features: string[];
  comparison: Record<string, string | number | boolean>;
  prices: DefaultBillingPrice[];
};

export const DEFAULT_BILLING_PLANS: DefaultBillingPlan[] = [
  {
    slug: "free",
    name: "Free",
    description: "Try OnlinePOS for 14 days with essential POS tools.",
    plan: "FREE",
    sortOrder: 0,
    features: [
      "14-day free access",
      "Basic POS",
      "Products and orders",
      "Customer records",
    ],
    comparison: {
      users: 1,
      products: 100,
      reports: "Basic",
      support: "Community",
      trial: "14 days",
      sms: false,
    },
    prices: [
      { interval: "MONTHLY", currency: "GHS", amount: 0 },
      { interval: "YEARLY", currency: "GHS", amount: 0 },
      { interval: "MONTHLY", currency: "USD", amount: 0 },
      { interval: "YEARLY", currency: "USD", amount: 0 },
    ],
  },
  {
    slug: "pro",
    name: "Pro",
    description: "For growing shops that need automation and reports.",
    plan: "PRO",
    sortOrder: 1,
    isPopular: true,
    features: ["Advanced POS", "Inventory tracking", "SMS receipts", "Reports"],
    comparison: {
      users: 5,
      products: 2000,
      reports: "Advanced",
      support: "Priority email",
      sms: true,
    },
    prices: [
      { interval: "MONTHLY", currency: "GHS", amount: 149 },
      { interval: "YEARLY", currency: "GHS", amount: 1490 },
      { interval: "MONTHLY", currency: "USD", amount: 19 },
      { interval: "YEARLY", currency: "USD", amount: 190 },
    ],
  },
  {
    slug: "business",
    name: "Business",
    description: "For multi-staff stores with richer controls.",
    plan: "BUSINESS",
    sortOrder: 2,
    features: ["Everything in Pro", "Staff roles", "Supplier workflows", "Advanced analytics"],
    comparison: {
      users: 20,
      products: 10000,
      reports: "Advanced + exports",
      support: "Priority chat",
      sms: true,
    },
    prices: [
      { interval: "MONTHLY", currency: "GHS", amount: 399 },
      { interval: "YEARLY", currency: "GHS", amount: 3990 },
      { interval: "MONTHLY", currency: "USD", amount: 49 },
      { interval: "YEARLY", currency: "USD", amount: 490 },
    ],
  },
  {
    slug: "enterprise",
    name: "Enterprise",
    description: "Custom terms for high-volume teams and franchises.",
    plan: "ENTERPRISE",
    sortOrder: 3,
    features: ["Everything in Business", "Custom onboarding", "Dedicated support", "Custom limits"],
    comparison: {
      users: "Unlimited",
      products: "Unlimited",
      reports: "Custom",
      support: "Dedicated",
      sms: true,
    },
    prices: [
      { interval: "MONTHLY", currency: "GHS", amount: 999 },
      { interval: "YEARLY", currency: "GHS", amount: 9990 },
      { interval: "MONTHLY", currency: "USD", amount: 129 },
      { interval: "YEARLY", currency: "USD", amount: 1290 },
    ],
  },
];

export const BILLING_CURRENCIES = ["GHS", "USD", "EUR", "GBP", "NGN"] as const;
