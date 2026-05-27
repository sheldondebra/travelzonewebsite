import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";
import { apiSuccess, handleApiError } from "@/server/utils/api-response";
import { parseJsonBody, withBusinessAuth } from "@/server/utils/with-auth";
import { variantInputSchema } from "@/server/validations/product";
import { assertPricingValid } from "@/lib/products/pricing";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    const product = await prisma.product.findFirst({
      where: { id, businessId, deletedAt: null },
    });
    if (!product) return handleApiError(new NotFoundError("Product not found"));

    const variants = await prisma.productVariant.findMany({
      where: { productId: id, deletedAt: null },
      orderBy: { name: "asc" },
    });
    return apiSuccess(variants, "Variants loaded");
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return withBusinessAuth(request, async (businessId) => {
    try {
      const product = await prisma.product.findFirst({
        where: { id, businessId, deletedAt: null, productType: "VARIABLE" },
      });
      if (!product) throw new NotFoundError("Variable product not found");

      const body = await parseJsonBody(request);
      const input = variantInputSchema.parse(body);
      assertPricingValid({
        costPrice: input.costPrice,
        retailPrice: input.retailPrice,
        wholesalePrice: input.wholesalePrice,
        minimumPrice: input.minimumPrice,
      });

      const variant = await prisma.$transaction(async (tx) => {
        const v = await tx.productVariant.create({
          data: {
            productId: id,
            name: input.name,
            sku: input.sku || null,
            barcode: input.barcode || null,
            costPrice: input.costPrice,
            retailPrice: input.retailPrice,
            wholesalePrice: input.wholesalePrice,
            minimumPrice: input.minimumPrice,
            stockQuantity: input.stockQuantity,
            imageUrl: input.imageUrl || null,
          },
        });
        await tx.productStock.create({
          data: {
            productId: id,
            variantId: v.id,
            quantity: input.stockQuantity,
          },
        });
        await tx.product.update({
          where: { id },
          data: {
            stockQuantity: {
              increment: input.stockQuantity,
            },
          },
        });
        return v;
      });

      return apiSuccess(variant, "Variant added", 201);
    } catch (error) {
      return handleApiError(error);
    }
  });
}
