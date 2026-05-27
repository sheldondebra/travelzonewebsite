import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  CircleDollarSign,
  Clock,
  RotateCcw,
} from "lucide-react";
import { formatPaymentStatus } from "@/lib/orders/format";

export type PaymentStatusKey =
  | "paid"
  | "pending"
  | "partially_paid"
  | "refunded";

export const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatusKey,
  {
    label: string;
    badge: string;
    border: string;
    dot: string;
    icon: LucideIcon;
    tile: string;
    iconBg: string;
  }
> = {
  paid: {
    label: "Paid",
    badge: "bg-emerald-500/15 text-emerald-900 ring-emerald-500/20",
    border: "border-l-emerald-500",
    dot: "bg-emerald-500",
    icon: CircleDollarSign,
    tile: "from-emerald-500/20 to-emerald-500/5 text-emerald-900",
    iconBg: "bg-emerald-500/15 text-emerald-700",
  },
  pending: {
    label: "Pending",
    badge: "bg-amber-500/15 text-amber-900 ring-amber-500/20",
    border: "border-l-amber-400",
    dot: "bg-amber-500",
    icon: Clock,
    tile: "from-amber-500/20 to-amber-500/5 text-amber-900",
    iconBg: "bg-amber-500/15 text-amber-700",
  },
  partially_paid: {
    label: "Partial",
    badge: "bg-sky-500/15 text-sky-900 ring-sky-500/20",
    border: "border-l-sky-500",
    dot: "bg-sky-500",
    icon: Banknote,
    tile: "from-sky-500/20 to-sky-500/5 text-sky-900",
    iconBg: "bg-sky-500/15 text-sky-700",
  },
  refunded: {
    label: "Refunded",
    badge: "bg-red-500/15 text-red-900 ring-red-500/20",
    border: "border-l-red-500",
    dot: "bg-red-500",
    icon: RotateCcw,
    tile: "from-red-500/20 to-red-500/5 text-red-900",
    iconBg: "bg-red-500/15 text-red-700",
  },
};

export function paymentStatusMeta(status: string) {
  const key = status as PaymentStatusKey;
  if (PAYMENT_STATUS_CONFIG[key]) {
    return {
      key,
      ...PAYMENT_STATUS_CONFIG[key],
      label: formatPaymentStatus(status),
    };
  }
  return {
    key: "pending" as PaymentStatusKey,
    ...PAYMENT_STATUS_CONFIG.pending,
    label: formatPaymentStatus(status),
  };
}

import { deliveryStatusMeta } from "@/lib/orders/delivery";

export function deliveryTone(status: string) {
  const meta = deliveryStatusMeta(status);
  return `${meta.badge} ring-1 ring-inset`;
}
