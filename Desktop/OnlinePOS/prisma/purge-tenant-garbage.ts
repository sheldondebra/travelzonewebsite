import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { purgeGarbageProducts } from "../src/server/services/product/purge-garbage-products";

const businessId =
  process.argv[2] ?? "cmpgfvbkp000000y6hxmxj7y0";

async function main() {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!business) throw new Error(`Business ${businessId} not found`);

  const before = await prisma.product.count({ where: { businessId } });
  const purged = await purgeGarbageProducts(businessId);
  const noOld = await prisma.product.deleteMany({
    where: { businessId, oldId: null },
  });
  const after = await prisma.product.count({
    where: { businessId, oldId: { not: null }, deletedAt: null, isActive: true },
  });

  console.log(business.name, {
    before,
    purged: purged.removed,
    deletedNoOldId: noOld.count,
    listableAfter: after,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
