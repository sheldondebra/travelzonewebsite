import { sendTransactionalSms } from "@/server/services/sms/sms-service";
import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/server/utils/errors";

export async function sendCustomerSms(
  businessId: string,
  customerId: string,
  message: string,
) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    select: { id: true, name: true, phone: true },
  });

  if (!customer) throw new NotFoundError("Customer not found");
  if (!customer.phone?.trim()) {
    throw new Error("This customer has no phone number on file");
  }

  const result = await sendTransactionalSms({
    businessId,
    recipient: customer.phone,
    message,
    category: "MANUAL",
    relatedType: "CUSTOMER",
    relatedId: customer.id,
    skipAutomationCheck: true,
  });

  if (!result.sent) {
    throw new Error(result.reason ?? "SMS could not be sent");
  }

  return { sent: true, phone: customer.phone, logId: result.logId };
}
