import { prisma } from "@/lib/prisma";

const WALK_IN_NAME = "Walk-in Customer";

export async function getOrCreateWalkInCustomer(businessId: string) {
  const existing = await prisma.customer.findFirst({
    where: { businessId, name: WALK_IN_NAME },
  });
  if (existing) return existing;

  return prisma.customer.create({
    data: {
      businessId,
      name: WALK_IN_NAME,
      tags: ["pos-walk-in"],
    },
  });
}
