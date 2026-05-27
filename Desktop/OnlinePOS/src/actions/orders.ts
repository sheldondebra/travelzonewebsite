"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { createOrder } from "@/server/services/order/create-order";
import { createOrderSchema } from "@/server/validations/order";
import { UnauthorizedError } from "@/server/utils/errors";

async function requireBusinessId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    throw new UnauthorizedError();
  }
  return session.user.businessId;
}

export async function createOrderAction(input: {
  customerId: string;
  paymentStatus: string;
  deliveryStatus: string;
  items: { productId: string; quantity: number }[];
}) {
  const businessId = await requireBusinessId();
  const parsed = createOrderSchema.parse(input);
  const order = await createOrder(businessId, parsed);
  revalidatePath("/dashboard/orders");
  revalidatePath("/dashboard");
  return { success: true, data: order, message: "Order created" };
}
