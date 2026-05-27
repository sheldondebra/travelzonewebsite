import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function getProductPriceHistory(
  businessId: string,
  productId: string,
  variantId?: string,
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });
  if (!product) throw new NotFoundError("Product not found");

  return prisma.productPriceHistory.findMany({
    where: {
      productId,
      ...(variantId ? { variantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      variant: { select: { id: true, name: true } },
    },
  });
}
