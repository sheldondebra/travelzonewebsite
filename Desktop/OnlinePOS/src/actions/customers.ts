"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth-options";
import { createCustomer } from "@/server/services/customer/create-customer";
import { createCustomerSchema } from "@/server/validations/customer";
import { UnauthorizedError } from "@/server/utils/errors";

async function requireBusinessId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.businessId) {
    throw new UnauthorizedError();
  }
  return session.user.businessId;
}

export async function createCustomerAction(formData: FormData) {
  const businessId = await requireBusinessId();
  const input = createCustomerSchema.parse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });

  const customer = await createCustomer(businessId, input);
  revalidatePath("/dashboard/people/customers");
  return { success: true, data: customer, message: "Customer created" };
}
