import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { NotFoundError } from "@/server/utils/errors";
import { logActivity } from "@/server/utils/activity";
import type { HoldSaleInput } from "@/server/validations/pos";

export async function listHeldSales(businessId: string) {
  return prisma.posHeldSale.findMany({
    where: { businessId },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      cashier: { select: { id: true, name: true } },
    },
  });
}

export async function holdSale(
  businessId: string,
  userId: string | null,
  input: HoldSaleInput,
) {
  const held = await prisma.posHeldSale.create({
    data: {
      businessId,
      cashierId: userId,
      label: input.label,
      customerId: input.customerId,
      payload: input.payload as Prisma.InputJsonValue,
    },
  });

  await logActivity({
    businessId,
    userId,
    action: "held",
    entity: "pos_sale",
    entityId: held.id,
    details: input.label,
  });

  return held;
}

export async function deleteHeldSale(businessId: string, id: string) {
  const held = await prisma.posHeldSale.findFirst({
    where: { id, businessId },
  });
  if (!held) throw new NotFoundError("Held sale not found");
  await prisma.posHeldSale.delete({ where: { id } });
  return { id };
}

export async function getHeldSale(businessId: string, id: string) {
  const held = await prisma.posHeldSale.findFirst({
    where: { id, businessId },
  });
  if (!held) throw new NotFoundError("Held sale not found");
  return held;
}
