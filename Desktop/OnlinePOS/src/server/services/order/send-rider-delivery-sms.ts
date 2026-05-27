import {
  buildGoogleMapsUrl,
  buildRiderSmsMessage,
} from "@/lib/orders/delivery-maps";
import { getDeliveryFromMeta } from "@/lib/orders/delivery";
import { orderItemsDisplay, orderRef } from "@/lib/orders/format";
import { prisma } from "@/lib/prisma";
import { sendTransactionalSms } from "@/server/services/sms/sms-service";
import { NotFoundError } from "@/server/utils/errors";

export async function sendRiderDeliverySms(
  businessId: string,
  orderId: string,
  opts?: { riderPhone?: string },
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    include: {
      customer: { select: { name: true } },
      business: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
  });

  if (!order) throw new NotFoundError("Order not found");

  const delivery = getDeliveryFromMeta(order.legacyMeta);
  const phone = (opts?.riderPhone ?? delivery.riderPhone)?.trim();
  if (!phone) {
    throw new Error("Enter a rider phone number before sending SMS");
  }

  const mapsUrl = buildGoogleMapsUrl(delivery);
  const sold = orderItemsDisplay(order.items);

  const message = buildRiderSmsMessage({
    businessName: order.business.name,
    orderRef: orderRef(order),
    customerName: order.customer.name,
    delivery,
    deliveryStatus: order.deliveryStatus,
    mapsUrl,
    itemsSummary: sold.headline,
  });

  const result = await sendTransactionalSms({
    businessId,
    recipient: phone,
    message,
    category: "RIDER_NOTIFICATION",
    automationKey: "rider_sms",
    relatedType: "ORDER",
    relatedId: orderId,
  });

  if (!result.sent && !result.skipped) {
    throw new Error(result.reason ?? "Rider SMS failed");
  }

  return { sent: result.sent, phone, mapsUrl, skipped: result.skipped, reason: result.reason };
}
