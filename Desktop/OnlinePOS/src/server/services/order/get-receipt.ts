import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function getReceiptData(businessId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId },
    include: {
      customer: true,
      cashier: { select: { id: true, name: true } },
      items: { include: { product: true, variant: true } },
      business: true,
    },
  });

  if (!order) throw new NotFoundError("Order not found");
  return order;
}
