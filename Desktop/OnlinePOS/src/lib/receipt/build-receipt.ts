import type { BusinessSettings } from "@/lib/settings/defaults";
import type { ReceiptModel, ReceiptTotals } from "@/lib/receipt/types";
import { formatCurrency, type CurrencyConfig } from "@/lib/settings/helpers";

type OrderWithRelations = {
  id: string;
  reference: string | null;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  deliveryStatus: string;
  paymentMethod: string | null;
  momoReference: string | null;
  momoNetwork: string | null;
  notes: string | null;
  createdAt: Date;
  legacyMeta: unknown;
  customer: { name: string; phone: string | null; email: string | null };
  business: {
    name: string;
    logoUrl: string | null;
    currency: string;
    receiptFooter: string | null;
  };
  items: {
    quantity: number;
    price: number;
    lineLabel: string | null;
    product: { name: string; sku: string | null };
    variant: { name: string; sku: string | null } | null;
  }[];
};

function readMetaNumber(meta: unknown, key: string): number {
  if (!meta || typeof meta !== "object") return 0;
  const v = (meta as Record<string, unknown>)[key];
  return typeof v === "number" ? v : Number(v) || 0;
}

export function buildReceiptTotals(order: OrderWithRelations): ReceiptTotals {
  const subtotal = order.items.reduce(
    (s, i) => s + i.price * i.quantity,
    0,
  );
  const meta = order.legacyMeta;
  const taxAmount = readMetaNumber(meta, "taxAmount");
  const discountAmount = readMetaNumber(meta, "discountAmount");
  const shippingAmount = readMetaNumber(meta, "shippingAmount");
  const derivedTax = Math.max(
    0,
    order.totalAmount - subtotal + discountAmount - shippingAmount,
  );
  const amountPaid = order.amountPaid;
  return {
    subtotal,
    taxAmount: taxAmount || derivedTax,
    discountAmount,
    shippingAmount,
    total: order.totalAmount,
    amountPaid,
    changeDue: Math.max(0, amountPaid - order.totalAmount),
  };
}

export function buildReceiptModel(
  order: OrderWithRelations,
  posReceipt: BusinessSettings["posReceipt"],
): ReceiptModel {
  const lines = order.items.map((item) => {
    const label =
      item.lineLabel ??
      (item.variant
        ? `${item.product.name} — ${item.variant.name}`
        : item.product.name);
    const sku = item.variant?.sku ?? item.product.sku ?? null;
    return {
      label,
      sku,
      quantity: item.quantity,
      unitPrice: item.price,
      lineTotal: item.price * item.quantity,
    };
  });

  return {
    orderId: order.id,
    orderRef: order.reference ?? order.id.slice(-8).toUpperCase(),
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    paymentMethod: order.paymentMethod,
    momoReference: order.momoReference,
    momoNetwork: order.momoNetwork,
    notes: order.notes,
    business: order.business,
    customer: order.customer,
    lines,
    totals: buildReceiptTotals(order),
    config: posReceipt,
  };
}

export function formatMoney(
  currency: string | CurrencyConfig,
  amount: number,
  decimals?: number,
) {
  return formatCurrency(amount, currency, { decimals });
}

export function renderTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

export function buildItemsSummary(lines: ReceiptModel["lines"], maxLen = 320) {
  const parts = lines.map(
    (l) => `${l.quantity}x ${l.label} @ ${l.lineTotal.toFixed(2)}`,
  );
  let text = parts.join("; ");
  if (text.length > maxLen) {
    text = `${parts.slice(0, 3).join("; ")}… +${lines.length - 3} more`;
  }
  return text;
}

export function buildSmsReceiptBody(
  receipt: ReceiptModel,
  template: string,
): string {
  const thankYou =
    receipt.config.thankYouMessage ||
    receipt.business.receiptFooter ||
    "Thank you!";
  return renderTemplate(template, {
    businessName: receipt.business.name,
    name: receipt.customer.name,
    orderId: receipt.orderId,
    orderRef: receipt.orderRef,
    date: receipt.createdAt.toLocaleString(),
    total: formatMoney(receipt.business.currency, receipt.totals.total),
    paid: formatMoney(receipt.business.currency, receipt.totals.amountPaid),
    paymentStatus: receipt.paymentStatus,
    itemsSummary: buildItemsSummary(receipt.lines, 200),
    thankYou,
  });
}

export function buildEmailReceiptBody(
  receipt: ReceiptModel,
  template: string,
): string {
  const thankYou =
    receipt.config.thankYouMessage ||
    receipt.business.receiptFooter ||
    "Thank you!";
  return renderTemplate(template, {
    businessName: receipt.business.name,
    name: receipt.customer.name,
    orderId: receipt.orderId,
    orderRef: receipt.orderRef,
    date: receipt.createdAt.toLocaleString(),
    total: formatMoney(receipt.business.currency, receipt.totals.total),
    paid: formatMoney(receipt.business.currency, receipt.totals.amountPaid),
    paymentStatus: receipt.paymentStatus,
    itemsSummary: receipt.lines
      .map(
        (l) =>
          `• ${l.label} × ${l.quantity} = ${formatMoney(receipt.business.currency, l.lineTotal)}`,
      )
      .join("\n"),
    thankYou,
  });
}
