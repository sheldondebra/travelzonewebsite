import type { PaymentMethod } from "@/generated/prisma/client";

export function mapLegacyPaymentMethodName(name: string): PaymentMethod {
  const n = name.toLowerCase();
  if (n.includes("momo") || n.includes("mobile")) return "MOMO";
  if (n.includes("card") || n.includes("credit")) return "CARD";
  if (n.includes("bank") || n.includes("transfer") || n.includes("check")) {
    return "BANK_TRANSFER";
  }
  if (n.includes("cash")) return "CASH";
  return "CASH";
}

export function mapLegacyPaymentStatus(statut: unknown): string {
  const s = String(statut ?? "").toLowerCase();
  if (s === "paid" || s === "completed") return "paid";
  if (s === "partial" || s === "partially_paid") return "partial";
  if (s === "unpaid" || s === "pending") return "pending";
  return s || "paid";
}

export function mapLegacyDeliveryStatus(
  statut: unknown,
  shippingStatus: unknown,
): string {
  const ship = String(shippingStatus ?? "").toLowerCase();
  if (ship === "delivered" || ship === "completed") return "delivered";
  if (ship === "shipped" || ship === "processing") return ship;
  const s = String(statut ?? "").toLowerCase();
  if (s === "completed") return "delivered";
  if (s === "pending" || s === "ordered") return "pending";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return ship || s || "delivered";
}

export function parseLegacyDateTime(
  date: unknown,
  time?: unknown,
): Date | undefined {
  if (!date) return undefined;
  const d = String(date).trim();
  if (!time && /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(d)) {
    const parsed = new Date(d.replace(" ", "T"));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  const t = time ? String(time).trim() : "00:00:00";
  const iso = d.includes("T") ? d : `${d}T${t}`;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}
