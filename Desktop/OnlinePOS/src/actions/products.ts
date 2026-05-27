"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { createProduct } from "@/server/services/product/create-product";
import { deleteProduct } from "@/server/services/product/delete-product";
import { createProductSchema } from "@/server/validations/product";
import { UnauthorizedError } from "@/server/utils/errors";

async function requireBusinessId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    throw new UnauthorizedError();
  }
  return session.user.businessId;
}

export async function createProductAction(formData: FormData) {
  const businessId = await requireBusinessId();
  const input = createProductSchema.parse({
    name: formData.get("name"),
    productType: "SIMPLE",
    price: Number(formData.get("price")),
    costPrice: Number(formData.get("costPrice")),
    wholesalePrice: 0,
    minimumPrice: 0,
    stockQuantity: Number(formData.get("stockQuantity")),
    stockAlert: 5,
  });

  const product = await createProduct(businessId, input);
  revalidatePath("/dashboard/products");
  return { success: true, data: product, message: "Product created" };
}

export async function deleteProductAction(productId: string) {
  const businessId = await requireBusinessId();
  await deleteProduct(businessId, productId);
  revalidatePath("/dashboard/products");
  return { success: true, message: "Product deleted" };
}
