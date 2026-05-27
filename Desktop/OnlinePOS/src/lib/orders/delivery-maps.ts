import type { DeliveryDetails } from "@/lib/orders/delivery";
import { formatDeliveryStatusLabel } from "@/lib/orders/delivery";

export function formatDeliveryAddressLine(d: DeliveryDetails): string {
  return [d.formattedAddress ?? d.address, d.city, d.region, "Ghana"]
    .filter(Boolean)
    .join(", ");
}

/** Google Maps link for riders / navigation */
export function buildGoogleMapsUrl(d: DeliveryDetails): string {
  if (d.latitude != null && d.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${d.latitude},${d.longitude}`;
  }
  const query = formatDeliveryAddressLine(d);
  if (!query.replace(/,?\s*Ghana/gi, "").trim()) {
    return "https://www.google.com/maps";
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Static embed preview (no API key) */
export function buildGoogleMapsEmbedUrl(d: DeliveryDetails): string | null {
  if (d.latitude != null && d.longitude != null) {
    return `https://maps.google.com/maps?q=${d.latitude},${d.longitude}&z=16&output=embed`;
  }
  const q = formatDeliveryAddressLine(d);
  if (!q.replace(/,?\s*Ghana/gi, "").trim()) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
}

export function buildRiderSmsMessage(opts: {
  businessName: string;
  orderRef: string;
  customerName: string;
  delivery: DeliveryDetails;
  deliveryStatus: string;
  mapsUrl: string;
  itemsSummary?: string;
}): string {
  const {
    businessName,
    orderRef,
    customerName,
    delivery,
    deliveryStatus,
    mapsUrl,
    itemsSummary,
  } = opts;

  const lines = [
    `${businessName} — Delivery`,
    `Order: ${orderRef}`,
    `Customer: ${customerName}`,
    `Status: ${formatDeliveryStatusLabel(deliveryStatus)}`,
    `Address: ${formatDeliveryAddressLine(delivery)}`,
  ];

  if (delivery.phone) lines.push(`Contact: ${delivery.phone}`);
  if (delivery.riderName) lines.push(`Rider: ${delivery.riderName}`);
  if (delivery.scheduledAt) {
    lines.push(
      `Scheduled: ${new Date(delivery.scheduledAt).toLocaleString("en-GH", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`,
    );
  }
  if (delivery.notes) lines.push(`Notes: ${delivery.notes}`);
  if (itemsSummary) lines.push(`Items: ${itemsSummary}`);
  lines.push(`Open in Maps: ${mapsUrl}`);

  return lines.join("\n");
}
