import { prisma } from "@/lib/prisma";
import { getDeliveryFromMeta } from "@/lib/orders/delivery";
import type {
  CustomerAddress,
  CustomerDetailPayload,
  CustomerOrderSummary,
} from "@/lib/customers/types";
import { NotFoundError } from "@/server/utils/errors";

export type {
  CustomerAddress,
  CustomerDetailPayload,
  CustomerOrderItem,
  CustomerOrderSummary,
} from "@/lib/customers/types";

function parseAddresses(raw: unknown): CustomerAddress[] {
  if (!Array.isArray(raw)) return [];
  const out: CustomerAddress[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const o = entry as Record<string, unknown>;
    const line1 = typeof o.line1 === "string" ? o.line1.trim() : "";
    if (!line1) continue;
    out.push({
      label: typeof o.label === "string" ? o.label : "Address",
      line1,
      ...(typeof o.city === "string" ? { city: o.city } : {}),
    });
  }
  return out;
}

function formatDeliveryLine(d: CustomerOrderSummary["delivery"]): string | null {
  const parts = [
    d.formattedAddress ?? d.address,
    d.city,
    d.region,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function getCustomerDetail(
  businessId: string,
  customerId: string,
): Promise<CustomerDetailPayload> {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      user: { select: { id: true, email: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true, imageUrl: true },
              },
              variant: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!customer) throw new NotFoundError("Customer not found");

  const aggregates = await prisma.order.aggregate({
    where: { customerId, businessId },
    _sum: { totalAmount: true, amountPaid: true },
    _count: { id: true },
  });

  const pendingPayments = await prisma.order.count({
    where: {
      customerId,
      businessId,
      paymentStatus: { in: ["pending", "partially_paid"] },
    },
  });

  const totalOrders = aggregates._count.id;
  const totalSpending = aggregates._sum.totalAmount ?? 0;
  const totalAmountPaid = aggregates._sum.amountPaid ?? 0;
  const totalOutstanding = Math.max(0, totalSpending - totalAmountPaid);
  const lastPurchase = customer.orders[0]?.createdAt ?? null;

  const productCounts = new Map<string, { name: string; quantity: number }>();
  for (const order of customer.orders) {
    for (const item of order.items) {
      const key = item.productId;
      const existing = productCounts.get(key);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        productCounts.set(key, {
          name: item.product.name,
          quantity: item.quantity,
        });
      }
    }
  }

  const favoriteProducts = [...productCounts.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  const profileAddresses = parseAddresses(customer.addresses);
  const deliveryAddresses: CustomerDetailPayload["deliveryAddresses"] =
    profileAddresses.map((a) => ({
      label: a.label,
      address: [a.line1, a.city].filter(Boolean).join(", "),
      source: "profile" as const,
    }));

  const seenDelivery = new Set<string>();
  for (const order of customer.orders) {
    const delivery = getDeliveryFromMeta(order.legacyMeta);
    const line = formatDeliveryLine(delivery);
    if (line && !seenDelivery.has(line)) {
      seenDelivery.add(line);
      deliveryAddresses.push({
        label: order.reference ? `Order ${order.reference}` : "Delivery",
        address: line,
        source: "order",
      });
    }
  }

  const orders: CustomerOrderSummary[] = customer.orders.map((o) => ({
    id: o.id,
    reference: o.reference,
    totalAmount: o.totalAmount,
    amountPaid: o.amountPaid,
    paymentStatus: o.paymentStatus,
    deliveryStatus: o.deliveryStatus,
    paymentMethod: o.paymentMethod,
    createdAt: o.createdAt.toISOString(),
    delivery: getDeliveryFromMeta(o.legacyMeta),
    items: o.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      lineTotal: item.lineTotal,
      lineLabel: item.lineLabel,
      product: item.product,
      variant: item.variant,
    })),
  }));

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    notes: customer.notes,
    tags: customer.tags,
    balance: customer.balance,
    createdAt: customer.createdAt.toISOString(),
    userId: customer.userId,
    user: customer.user,
    addresses: profileAddresses,
    orders,
    stats: {
      totalOrders,
      totalSpending,
      totalAmountPaid,
      totalOutstanding,
      lastPurchase: lastPurchase?.toISOString() ?? null,
      pendingPayments,
      favoriteProducts,
    },
    deliveryAddresses,
  };
}
