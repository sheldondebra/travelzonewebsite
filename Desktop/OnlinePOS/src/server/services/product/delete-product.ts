import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function deleteProduct(businessId: string, productId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Product not found");

  await prisma.product.update({
    where: { id: productId },
    data: { deletedAt: new Date(), isActive: false },
  });
  return { id: productId };
}

export async function deactivateProduct(businessId: string, productId: string) {
  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId, deletedAt: null },
  });
  if (!existing) throw new NotFoundError("Product not found");

  await prisma.product.update({
    where: { id: productId },
    data: { isActive: false },
  });
  return { id: productId };
}
