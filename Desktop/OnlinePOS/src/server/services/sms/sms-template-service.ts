import { DEFAULT_SMS_TEMPLATES } from "@/lib/sms/default-templates";
import { prisma } from "@/lib/prisma";

export type SmsTemplateView = {
  key: string;
  title: string;
  message: string;
  isCustom: boolean;
  isActive: boolean;
  variables: string[];
};

const TEMPLATE_VARIABLES: Record<string, string[]> = {
  RECEIPT_SMS: [
    "businessName",
    "customerName",
    "receiptNumber",
    "orderNumber",
    "amount",
    "receiptLink",
  ],
  ORDER_CONFIRMATION: ["customerName", "orderNumber", "businessName", "amount"],
  PAYMENT_CONFIRMATION: [
    "orderNumber",
    "amount",
    "paymentMethod",
    "businessName",
  ],
  RIDER_DELIVERY_ASSIGNMENT: [
    "orderNumber",
    "customerName",
    "customerPhone",
    "deliveryAddress",
    "deliveryFee",
  ],
  DELIVERY_UPDATE: [
    "customerName",
    "orderNumber",
    "businessName",
    "deliveryStatus",
    "riderName",
    "riderPhone",
  ],
  DELIVERED: ["orderNumber", "businessName"],
  REFUND: ["orderNumber", "amount", "reason", "businessName"],
  PAY_LATER_REMINDER: ["customerName", "amount", "orderNumber", "businessName"],
  LOW_STOCK: ["productName", "stockQuantity", "unit"],
  DAILY_SUMMARY: ["businessName", "sales", "profit", "orders", "expenses"],
};

export async function listBusinessSmsTemplates(
  businessId: string,
): Promise<SmsTemplateView[]> {
  const [businessRows, globalRows] = await Promise.all([
    prisma.smsTemplate.findMany({ where: { businessId } }),
    prisma.smsTemplate.findMany({ where: { businessId: null } }),
  ]);

  return DEFAULT_SMS_TEMPLATES.map((def) => {
    const custom = businessRows.find((r) => r.key === def.key);
    const global = globalRows.find((r) => r.key === def.key);
    const source = custom ?? global;

    return {
      key: def.key,
      title: source?.title ?? def.title,
      message: source?.message ?? def.message,
      isCustom: Boolean(custom),
      isActive: source?.isActive ?? true,
      variables: TEMPLATE_VARIABLES[def.key] ?? [],
    };
  });
}

export async function upsertBusinessSmsTemplate(
  businessId: string,
  input: { key: string; title: string; message: string; isActive?: boolean },
) {
  const def = DEFAULT_SMS_TEMPLATES.find((t) => t.key === input.key);
  if (!def) throw new Error("Unknown template key");

  const existing = await prisma.smsTemplate.findFirst({
    where: { businessId, key: input.key },
  });

  if (existing) {
    return prisma.smsTemplate.update({
      where: { id: existing.id },
      data: {
        title: input.title,
        message: input.message,
        isActive: input.isActive ?? true,
      },
    });
  }

  return prisma.smsTemplate.create({
    data: {
      businessId,
      key: input.key,
      title: input.title,
      message: input.message,
      isActive: input.isActive ?? true,
    },
  });
}

export async function resetBusinessSmsTemplate(businessId: string, key: string) {
  await prisma.smsTemplate.deleteMany({ where: { businessId, key } });
}
