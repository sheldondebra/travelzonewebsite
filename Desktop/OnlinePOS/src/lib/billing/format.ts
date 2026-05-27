import type { BillingPaymentStatus, BillingSubscriptionStatus } from "@/generated/prisma/client";

export const billingPaymentStatusLabel: Record<BillingPaymentStatus, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Successful",
  FAILED: "Failed",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const billingSubscriptionStatusLabel: Record<BillingSubscriptionStatus, string> = {
  INCOMPLETE: "Incomplete",
  ACTIVE: "Active",
  PAST_DUE: "Past due",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function formatBillingMoney(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
