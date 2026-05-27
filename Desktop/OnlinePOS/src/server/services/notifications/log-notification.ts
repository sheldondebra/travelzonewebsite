import { prisma } from "@/lib/prisma";

export async function logNotification(params: {
  businessId?: string | null;
  channel: "sms" | "email";
  recipient: string;
  subject?: string;
  status: "sent" | "failed" | "skipped";
  message?: string;
  source?: string;
  orderId?: string;
}) {
  return prisma.notificationLog.create({
    data: {
      businessId: params.businessId ?? undefined,
      channel: params.channel,
      recipient: params.recipient,
      subject: params.subject,
      status: params.status,
      message: params.message,
      source: params.source ?? "pos_receipt",
      orderId: params.orderId,
    },
  });
}
