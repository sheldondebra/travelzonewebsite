import type { ReceiptModel } from "@/lib/receipt/types";
import { formatMoney } from "@/lib/receipt/build-receipt";
import { formatPaymentStatus } from "@/lib/orders/format";

export function buildReceiptShareText(receipt: ReceiptModel): string {
  const cur = receipt.business.currency;
  const thankYou =
    receipt.config.thankYouMessage ||
    receipt.business.receiptFooter ||
    "Thank you for your purchase!";

  const lines = [
    receipt.business.name,
    `Receipt #${receipt.orderRef}`,
    new Date(receipt.createdAt).toLocaleString(),
    "",
    ...receipt.lines.map(
      (l) =>
        `${l.quantity}× ${l.label} — ${formatMoney(cur, l.lineTotal)}`,
    ),
    "",
    `Total: ${formatMoney(cur, receipt.totals.total)}`,
    `Paid: ${formatMoney(cur, receipt.totals.amountPaid)}`,
    receipt.totals.changeDue > 0
      ? `Change: ${formatMoney(cur, receipt.totals.changeDue)}`
      : null,
    `Payment: ${formatPaymentStatus(receipt.paymentStatus)}`,
    "",
    thankYou,
  ].filter(Boolean) as string[];

  return lines.join("\n");
}

export function buildWhatsAppShareUrl(text: string, phone?: string | null): string {
  const encoded = encodeURIComponent(text);
  if (phone?.trim()) {
    const digits = phone.replace(/\D/g, "");
    return `https://wa.me/${digits}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function buildSmsShareUrl(text: string, phone?: string | null): string {
  const body = encodeURIComponent(text);
  if (phone?.trim()) {
    return `sms:${phone}?body=${body}`;
  }
  return `sms:?body=${body}`;
}

export function buildEmailShareUrl(
  subject: string,
  body: string,
  email?: string | null,
): string {
  const params = new URLSearchParams({
    subject,
    body,
  });
  return email?.trim()
    ? `mailto:${email}?${params}`
    : `mailto:?${params}`;
}
