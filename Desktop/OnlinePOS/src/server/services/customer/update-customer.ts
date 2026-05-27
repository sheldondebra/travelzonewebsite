import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";
import type { UpdateCustomerInput } from "@/server/validations/customer";

export async function updateCustomer(
  businessId: string,
  customerId: string,
  input: UpdateCustomerInput,
) {
  const existing = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });
  if (!existing) throw new NotFoundError("Customer not found");

  const { addresses, email, ...rest } = input;

  return prisma.customer.update({
    where: { id: customerId },
    data: {
      ...rest,
      email: email === "" ? null : email,
      addresses: addresses ?? undefined,
    },
  });
}
