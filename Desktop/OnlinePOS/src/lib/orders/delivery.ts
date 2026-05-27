import type { LucideIcon } from "lucide-react";
import {
  CircleCheck,
  Clock,
  Package,
  Truck,
} from "lucide-react";
import { z } from "zod";

export const DELIVERY_STATUSES = [
  "pickup",
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export const deliveryDetailsSchema = z.object({
  address: z.string().max(500).optional(),
  formattedAddress: z.string().max(500).optional(),
  city: z.string().max(120).optional(),
  region: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  notes: z.string().max(1000).optional(),
  scheduledAt: z.string().optional().nullable(),
  carrier: z.string().max(120).optional(),
  riderName: z.string().max(120).optional(),
  riderPhone: z.string().max(40).optional(),
  trackingNumber: z.string().max(120).optional(),
  placeId: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export type DeliveryDetails = z.infer<typeof deliveryDetailsSchema>;

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  pickup: "Pickup / in-store",
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ACTIVE_DELIVERY_STATUSES: DeliveryStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
];

export const DELIVERY_STATUS_UI: Record<
  DeliveryStatus,
  {
    label: string;
    shortLabel: string;
    icon: LucideIcon;
    badge: string;
    dot: string;
    /** Inactive status card */
    card: string;
    /** Active status card */
    cardActive: string;
    iconWrap: string;
    iconWrapActive: string;
  }
> = {
  pickup: {
    label: "Pickup / in-store",
    shortLabel: "Pickup",
    icon: Package,
    badge: "bg-slate-500/12 text-slate-700 ring-slate-500/20",
    dot: "bg-slate-400",
    card: "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
    cardActive: "border-slate-500 bg-slate-500 text-white shadow-md ring-2 ring-slate-500/25",
    iconWrap: "bg-slate-100 text-slate-600",
    iconWrapActive: "bg-white/20 text-white",
  },
  pending: {
    label: "Pending",
    shortLabel: "Pending",
    icon: Clock,
    badge: "bg-violet-500/15 text-violet-900 ring-violet-500/25",
    dot: "bg-violet-500",
    card: "border-violet-200 bg-violet-50/50 text-violet-900 hover:border-violet-300 hover:bg-violet-50",
    cardActive:
      "border-violet-500 bg-gradient-to-br from-violet-500 to-violet-600 text-white shadow-md ring-2 ring-violet-500/30",
    iconWrap: "bg-violet-100 text-violet-700",
    iconWrapActive: "bg-white/20 text-white",
  },
  processing: {
    label: "Processing",
    shortLabel: "Processing",
    icon: Package,
    badge: "bg-sky-500/15 text-sky-900 ring-sky-500/25",
    dot: "bg-sky-500",
    card: "border-sky-200 bg-sky-50/50 text-sky-900 hover:border-sky-300 hover:bg-sky-50",
    cardActive:
      "border-sky-500 bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-md ring-2 ring-sky-500/30",
    iconWrap: "bg-sky-100 text-sky-700",
    iconWrapActive: "bg-white/20 text-white",
  },
  shipped: {
    label: "Shipped",
    shortLabel: "Shipped",
    icon: Truck,
    badge: "bg-orange-500/15 text-orange-900 ring-orange-500/25",
    dot: "bg-orange-500",
    card: "border-orange-200 bg-orange-50/50 text-orange-900 hover:border-orange-300 hover:bg-orange-50",
    cardActive:
      "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md ring-2 ring-orange-500/30",
    iconWrap: "bg-orange-100 text-orange-700",
    iconWrapActive: "bg-white/20 text-white",
  },
  delivered: {
    label: "Delivered",
    shortLabel: "Delivered",
    icon: CircleCheck,
    badge: "bg-emerald-500/15 text-emerald-900 ring-emerald-500/25",
    dot: "bg-emerald-500",
    card: "border-emerald-200 bg-emerald-50/50 text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50",
    cardActive:
      "border-emerald-500 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md ring-2 ring-emerald-500/30",
    iconWrap: "bg-emerald-100 text-emerald-700",
    iconWrapActive: "bg-white/20 text-white",
  },
  cancelled: {
    label: "Cancelled",
    shortLabel: "Cancelled",
    icon: Clock,
    badge: "bg-red-500/15 text-red-900 ring-red-500/25",
    dot: "bg-red-500",
    card: "border-red-200 bg-red-50/50 text-red-900 hover:border-red-300 hover:bg-red-50",
    cardActive:
      "border-red-500 bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md ring-2 ring-red-500/30",
    iconWrap: "bg-red-100 text-red-700",
    iconWrapActive: "bg-white/20 text-white",
  },
};

export function deliveryStatusMeta(status: string) {
  const key = status as DeliveryStatus;
  const ui = DELIVERY_STATUS_UI[key] ?? DELIVERY_STATUS_UI.pending;
  return { key, ...ui, label: formatDeliveryStatusLabel(status) };
}

export function isDeliveryRequired(status: string) {
  return status !== "pickup";
}

export function formatDeliveryStatusLabel(status: string) {
  const key = status as DeliveryStatus;
  return DELIVERY_STATUS_LABELS[key] ?? status.replace(/_/g, " ");
}

export function getDeliveryFromMeta(legacyMeta: unknown): DeliveryDetails {
  if (!legacyMeta || typeof legacyMeta !== "object") return {};
  const delivery = (legacyMeta as { delivery?: unknown }).delivery;
  if (!delivery || typeof delivery !== "object") return {};
  const parsed = deliveryDetailsSchema.safeParse(delivery);
  return parsed.success ? parsed.data : {};
}

export function mergeDeliveryMeta(
  legacyMeta: unknown,
  details: DeliveryDetails,
): Record<string, unknown> {
  const base =
    legacyMeta && typeof legacyMeta === "object"
      ? { ...(legacyMeta as Record<string, unknown>) }
      : {};
  return {
    ...base,
    delivery: {
      ...getDeliveryFromMeta(legacyMeta),
      ...details,
    },
  };
}
