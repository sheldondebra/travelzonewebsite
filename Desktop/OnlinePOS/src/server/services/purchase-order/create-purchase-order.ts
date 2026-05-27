import { paginatedResult, type Paginated } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export type POItemInput = {
  productId: string;
  quantityOrdered: number;
  unitCost: number;
};

export async function createPurchaseOrder(
  businessId: string,
  data: {
    supplierId: string;
    reference?: string;
    notes?: string;
    items: POItemInput[];
  },
) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: data.supplierId, businessId },
  });
  if (!supplier) throw new NotFoundError("Supplier not found");

  const totalAmount = data.items.reduce(
    (s, i) => s + i.quantityOrdered * i.unitCost,
    0,
  );

  return prisma.purchaseOrder.create({
    data: {
      supplierId: data.supplierId,
      businessId,
      reference: data.reference,
      notes: data.notes,
      totalAmount,
      status: "ORDERED",
      items: { create: data.items },
    },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function receivePurchaseOrder(
  businessId: string,
  purchaseOrderId: string,
) {
  const po = await prisma.purchaseOrder.findFirst({
    where: { id: purchaseOrderId, businessId },
    include: { items: true },
  });
  if (!po) throw new NotFoundError("Purchase order not found");

  return prisma.$transaction(async (tx) => {
    for (const item of po.items) {
      const qty = item.quantityOrdered - item.quantityReceived;
      if (qty <= 0) continue;

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: qty } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          businessId,
          type: "STOCK_ADDED",
          quantity: qty,
          note: `PO ${po.reference ?? po.id} received`,
        },
      });

      await tx.purchaseOrderItem.update({
        where: { id: item.id },
        data: { quantityReceived: item.quantityOrdered },
      });
    }

    return tx.purchaseOrder.update({
      where: { id: purchaseOrderId },
      data: { status: "RECEIVED", receivedAt: new Date() },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });
  });
}

export async function listPurchaseOrders(businessId: string) {
  return prisma.purchaseOrder.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });
}

export async function listPurchaseOrdersPaginated(
  businessId: string,
  opts: { page: number; pageSize: number },
): Promise<Paginated<Awaited<ReturnType<typeof listPurchaseOrders>>[number]>> {
  const { page, pageSize } = opts;
  const where = { businessId };

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    }),
  ]);

  return paginatedResult(orders, total, page, pageSize);
}
