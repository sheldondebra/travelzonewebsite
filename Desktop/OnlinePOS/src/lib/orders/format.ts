export function orderRef(order: { id: string; reference?: string | null }) {
  return order.reference?.trim() || `#${order.id.slice(-8).toUpperCase()}`;
}

export type OrderItemLike = {
  quantity: number;
  product?: { name: string };
};

export function summarizeOrderItems(items: OrderItemLike[]) {
  const quantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const products = items.length;
  return { quantity, products };
}

/** Short label for badges and stat cards — e.g. "3 items" */
export function itemCountSummary(items: OrderItemLike[]) {
  const { quantity, products } = summarizeOrderItems(items);
  if (products === 0) return "No items";
  if (quantity === 1) return "1 item";
  return `${quantity} items`;
}

/** Table / list display with a clear headline + optional detail line */
export function orderItemsDisplay(items: OrderItemLike[]) {
  const { quantity, products } = summarizeOrderItems(items);

  if (products === 0) {
    return { headline: "No items", detail: null as string | null };
  }

  const firstName = items[0]?.product?.name?.trim();

  if (products === 1) {
    const headline = firstName
      ? quantity === 1
        ? firstName
        : `${firstName} × ${quantity}`
      : quantity === 1
        ? "1 item"
        : `${quantity} items`;
  return {
      headline,
      detail: firstName && quantity > 1 ? `${quantity} items sold` : null,
    };
  }

  const headline = firstName
    ? `${truncate(firstName, 28)} + ${products - 1} more`
    : `${quantity} items`;

  return {
    headline,
    detail: `${quantity} items from ${products} products`,
  };
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

export function formatPaymentStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function paymentStatusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "paid") return "default";
  if (status === "pending") return "outline";
  if (status === "refunded") return "destructive";
  return "secondary";
}

export function formatDeliveryStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
