import { prisma } from "@/lib/prisma";
import { mergeSettings } from "@/lib/settings/defaults";
import { calculateOrderTotals } from "@/server/services/order/calculate-profit";
import { decrementStockForSale } from "@/server/services/order/decrement-sale-stock";
import { bumpRegisterExpectedCash } from "@/server/services/pos/register";
import { NotFoundError } from "@/server/utils/errors";
import { createNotification } from "@/server/utils/notifications";
import { logActivity } from "@/server/utils/activity";
import type { CreateOrderInput } from "@/server/validations/order";
import type { PaymentMethod } from "@/generated/prisma/client";
import type { DeliveryDetails } from "@/lib/orders/delivery";

function compactDeliveryDetails(details?: DeliveryDetails) {
  if (!details) return undefined;
  const entries = Object.entries(details).filter(
    ([, value]) => value !== undefined && value !== "",
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export async function createOrder(
  businessId: string,
  input: CreateOrderInput,
  userId?: string | null,
) {
  const uniqueProductIds = [
    ...new Set(input.items.map((i) => i.productId)),
  ];
  const variantIds = input.items
    .map((i) => i.variantId)
    .filter((id): id is string => !!id);

  const [products, variants, business, customer] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: uniqueProductIds }, businessId, deletedAt: null },
    }),
    variantIds.length
      ? prisma.productVariant.findMany({
          where: {
            id: { in: variantIds },
            deletedAt: null,
            product: { businessId, deletedAt: null },
          },
        })
      : Promise.resolve([]),
    prisma.business.findUnique({ where: { id: businessId } }),
    prisma.customer.findFirst({
      where: { id: input.customerId, businessId },
    }),
  ]);

  if (products.length !== uniqueProductIds.length) {
    throw new NotFoundError("One or more products not found");
  }
  if (!customer) throw new NotFoundError("Customer not found");

  const variantMap = new Map(variants.map((v) => [v.id, v]));
  const productMap = new Map(products.map((p) => [p.id, p]));
  const threshold = business?.lowStockThreshold ?? 5;
  const settings = mergeSettings(business?.settings, {
    currency: business?.currency,
    receiptFooter: business?.receiptFooter,
    themeColor: business?.themeColor,
  });
  const allowNegativeStock = settings.warehouse.allowNegativeStock;

  const lineData = input.items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product) throw new NotFoundError("Product not found");

    const variant = item.variantId
      ? variantMap.get(item.variantId)
      : undefined;

    if (item.variantId && (!variant || variant.productId !== product.id)) {
      throw new NotFoundError("Variant not found for product");
    }

    const unitPrice =
      item.unitPrice ?? variant?.retailPrice ?? product.price;
    const costPrice = variant?.costPrice ?? product.costPrice;
    const lineLabel = variant
      ? `${product.name} — ${variant.name}`
      : product.name;

    return {
      productId: product.id,
      variantId: variant?.id ?? null,
      productName: product.name,
      lineLabel,
      quantity: item.quantity,
      price: unitPrice,
      costPrice,
      stockDecrement: item.quantity,
    };
  });

  const { totalAmount: subtotal, profit: lineProfit } =
    calculateOrderTotals(lineData);
  const taxPercent = input.taxPercent ?? business?.taxRate ?? 0;
  const taxAmount = (subtotal * taxPercent) / 100;
  const discountAmount = input.discountAmount ?? 0;
  const isDeliveryOrder = input.deliveryStatus !== "pickup";
  const shippingAmount = isDeliveryOrder ? (input.shippingAmount ?? 0) : 0;
  const totalAmount = Math.max(
    0,
    subtotal + taxAmount - discountAmount + shippingAmount,
  );
  const profit = lineProfit - discountAmount;
  const deliveryMeta = isDeliveryOrder
    ? compactDeliveryDetails(input.deliveryDetails)
    : undefined;

  const splitPayments = input.payments ?? [];
  let amountPaid =
    input.amountPaid ??
    (input.paymentStatus === "paid" ? totalAmount : 0);
  let paymentMethod = input.paymentMethod as PaymentMethod | undefined;
  let changeDue = input.changeDue ?? 0;
  let momoReference = input.momoReference;
  let momoNetwork = input.momoNetwork;

  if (splitPayments.length > 0) {
    amountPaid = splitPayments.reduce((sum, p) => sum + p.amount, 0);
    paymentMethod =
      splitPayments.length > 1 ? "SPLIT" : splitPayments[0].method;
    const cashLine = splitPayments.find((p) => p.method === "CASH");
    if (cashLine && !input.changeDue) {
      const nonCash = amountPaid - cashLine.amount;
      const cashDue = Math.max(0, totalAmount - nonCash);
      changeDue = Math.max(0, cashLine.amount - cashDue);
    }
    const momoLine = splitPayments.find((p) => p.method === "MOMO");
    if (momoLine) {
      momoReference = momoLine.reference;
      momoNetwork = momoLine.network;
    }
  } else if (
    paymentMethod === "CASH" &&
    amountPaid > totalAmount &&
    !input.changeDue
  ) {
    changeDue = amountPaid - totalAmount;
  }

  const order = await prisma.$transaction(async (tx) => {
    for (const line of lineData) {
      await decrementStockForSale(
        tx,
        businessId,
        {
          productId: line.productId,
          productName: line.productName,
          variantId: line.variantId,
          quantity: line.stockDecrement,
        },
        { allowNegativeStock },
      );

      const updated = await tx.product.findUnique({
        where: { id: line.productId },
        select: { stockQuantity: true, name: true },
      });

      if (updated && updated.stockQuantity <= threshold) {
        await createNotification({
          businessId,
          title: "Low stock alert",
          message: `${line.lineLabel} stock is below ${threshold} (${updated.stockQuantity} left).`,
          type: "low_stock",
          link: "/dashboard/products",
        });
      }

      await tx.inventoryMovement.create({
        data: {
          productId: line.productId,
          businessId,
          type: "SALE",
          quantity: -line.stockDecrement,
          note: line.variantId ? `POS sale (variant)` : `POS sale`,
        },
      });
    }

    const reference = `SL_${Date.now().toString(36).slice(-6).toUpperCase()}`;

    const created = await tx.order.create({
      data: {
        reference,
        totalAmount,
        profit,
        amountPaid,
        changeDue,
        paymentStatus: input.paymentStatus,
        deliveryStatus: input.deliveryStatus,
        saleStatus: "COMPLETED",
        paymentMethod,
        momoReference,
        momoNetwork,
        transactionId: input.transactionId,
        notes: input.notes,
        cashierId: userId ?? undefined,
        registerSessionId: input.registerSessionId,
        legacyMeta: {
          taxPercent,
          taxAmount,
          discountAmount,
          shippingAmount,
          subtotal,
          ...(deliveryMeta ? { delivery: deliveryMeta } : {}),
        },
        customerId: input.customerId,
        businessId,
        items: {
          create: lineData.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            lineLabel: line.lineLabel,
            quantity: line.quantity,
            price: line.price,
          })),
        },
        payments:
          splitPayments.length > 0
            ? {
                create: splitPayments.map((p) => ({
                  method: p.method,
                  amount: p.amount,
                  reference: p.reference,
                  network: p.network,
                })),
              }
            : undefined,
        statusHistory: {
          create: [
            {
              field: "paymentStatus",
              toValue: input.paymentStatus,
              note: "Order created",
            },
            {
              field: "deliveryStatus",
              toValue: input.deliveryStatus,
              note: "Order created",
            },
          ],
        },
      },
      include: {
        customer: true,
        items: { include: { product: true, variant: true } },
        payments: true,
        statusHistory: true,
      },
    });

    return created;
  });

  if (input.registerSessionId) {
    const cashTotal =
      splitPayments.length > 0
        ? splitPayments
            .filter((p) => p.method === "CASH")
            .reduce((s, p) => s + p.amount, 0) - changeDue
        : paymentMethod === "CASH"
          ? amountPaid - changeDue
          : 0;
    if (cashTotal > 0) {
      await bumpRegisterExpectedCash(input.registerSessionId, cashTotal);
    }
  }

  const orderWithRelations = order;

  await createNotification({
    businessId,
    title: "New order",
    message: `Order from ${customer.name} — ${totalAmount.toFixed(2)}`,
    type: "new_order",
    link: "/dashboard/orders",
  });

  await logActivity({
    businessId,
    userId,
    action: "created",
    entity: "order",
    entityId: orderWithRelations.id,
    details: `Total ${totalAmount}`,
  });

  return orderWithRelations;
}
