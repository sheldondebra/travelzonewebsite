import { prisma } from "@/lib/prisma";
import { AppError, NotFoundError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";
import type { RefundSaleInput } from "@/server/validations/pos";

async function nextSaleReturnOldId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  businessId: string,
) {
  const max = await tx.saleReturn.aggregate({
    where: { businessId },
    _max: { oldId: true },
  });
  return (max._max.oldId ?? BigInt(0)) + BigInt(1);
}

export async function refundOrVoidSale(
  businessId: string,
  userId: string,
  input: RefundSaleInput,
) {
  const order = await prisma.order.findFirst({
    where: { id: input.orderId, businessId },
    include: { items: true },
  });
  if (!order) throw new NotFoundError("Order not found");
  if (order.saleStatus === "VOIDED" || order.saleStatus === "REFUNDED") {
    throw new AppError("Order already voided or refunded", 409);
  }

  const isVoid = input.action === "void";
  const linesToReturn = isVoid
    ? order.items.map((item) => ({
        orderItemId: item.id,
        quantity: item.quantity,
      }))
    : (input.lines ?? []);

  if (!linesToReturn.length) {
    throw new AppError("Select items to refund", 400);
  }

  const itemMap = new Map(order.items.map((i) => [i.id, i]));
  const returnLines: {
    productId: string | null;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    lineLabel: string | null;
  }[] = [];

  let refundTotal = 0;

  for (const line of linesToReturn) {
    const item = itemMap.get(line.orderItemId);
    if (!item) throw new NotFoundError("Order item not found");
    if (line.quantity > item.quantity) {
      throw new AppError(`Cannot refund more than sold for ${item.lineLabel ?? item.productId}`, 400);
    }
    const lineTotal = item.price * line.quantity;
    refundTotal += lineTotal;
    returnLines.push({
      productId: item.productId,
      variantId: item.variantId,
      quantity: line.quantity,
      unitPrice: item.price,
      lineTotal,
      lineLabel: item.lineLabel,
    });
  }

  const fullRefund = isVoid || refundTotal >= order.totalAmount;

  const saleReturn = await prisma.$transaction(async (tx) => {
    for (const line of returnLines) {
      if (!line.productId) continue;

      if (line.variantId) {
        await tx.productVariant.update({
          where: { id: line.variantId },
          data: { stockQuantity: { increment: line.quantity } },
        });
      } else {
        await tx.product.update({
          where: { id: line.productId },
          data: { stockQuantity: { increment: line.quantity } },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          productId: line.productId,
          businessId,
          type: "RETURN",
          quantity: line.quantity,
          note: isVoid ? "POS void" : "POS refund",
        },
      });
    }

    const oldId = await nextSaleReturnOldId(tx, businessId);

    const record = await tx.saleReturn.create({
      data: {
        oldId,
        businessId,
        orderId: order.id,
        customerId: order.customerId,
        reference: `RF_${Date.now().toString(36).slice(-6).toUpperCase()}`,
        totalAmount: refundTotal,
        amountPaid: refundTotal,
        paymentStatus: "refunded",
        status: isVoid ? "voided" : "completed",
        notes: input.reason,
        lines: {
          create: returnLines,
        },
      },
      include: { lines: true },
    });

    await tx.order.update({
      where: { id: order.id },
      data: {
        saleStatus: fullRefund ? (isVoid ? "VOIDED" : "REFUNDED") : order.saleStatus,
        paymentStatus: fullRefund ? "refunded" : "partially_paid",
        statusHistory: {
          create: {
            field: "paymentStatus",
            fromValue: order.paymentStatus,
            toValue: fullRefund ? "refunded" : "partially_paid",
            note: isVoid ? "Sale voided" : "Partial refund",
          },
        },
      },
    });

    return record;
  });

  await logActivity({
    businessId,
    userId,
    action: isVoid ? "voided" : "refunded",
    entity: "order",
    entityId: order.id,
    details: `${refundTotal.toFixed(2)} — ${input.reason ?? ""}`.trim(),
  });

  return { saleReturn, refundTotal, fullRefund };
}
