import {
  isDeliveryRequired,
  mergeDeliveryMeta,
} from "@/lib/orders/delivery";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";
import type { UpdateOrderInput } from "@/server/validations/order";

export async function updateOrder(
  businessId: string,
  orderId: string,
  input: UpdateOrderInput,
  userId?: string | null,
) {
  const existing = await prisma.order.findFirst({
    where: { id: orderId, businessId },
  });
  if (!existing) throw new NotFoundError("Order not found");

  const historyEntries: {
    field: string;
    fromValue: string | null;
    toValue: string;
    note?: string;
  }[] = [];

  if (
    input.paymentStatus &&
    input.paymentStatus !== existing.paymentStatus
  ) {
    historyEntries.push({
      field: "paymentStatus",
      fromValue: existing.paymentStatus,
      toValue: input.paymentStatus,
    });
  }
  let deliveryStatus = input.deliveryStatus ?? existing.deliveryStatus;

  if (input.deliveryRequired !== undefined) {
    if (input.deliveryRequired && !isDeliveryRequired(deliveryStatus)) {
      deliveryStatus = "pending";
    }
    if (!input.deliveryRequired) {
      deliveryStatus = "pickup";
    }
  }

  if (deliveryStatus !== existing.deliveryStatus) {
    historyEntries.push({
      field: "deliveryStatus",
      fromValue: existing.deliveryStatus,
      toValue: deliveryStatus,
    });
  }

  const { deliveryRequired: _dr, deliveryDetails, ...orderFields } = input;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      ...orderFields,
      deliveryStatus,
      ...(deliveryDetails
        ? {
            legacyMeta: mergeDeliveryMeta(
              existing.legacyMeta,
              deliveryDetails,
            ) as Prisma.InputJsonValue,
          }
        : {}),
      statusHistory:
        historyEntries.length > 0
          ? { create: historyEntries }
          : undefined,
    },
    include: {
      customer: true,
      items: { include: { product: true } },
      statusHistory: { orderBy: { createdAt: "desc" } },
    },
  });

  await logActivity({
    businessId,
    userId,
    action: "updated",
    entity: "order",
    entityId: orderId,
  });

  return order;
}
