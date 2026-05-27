import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  businessId: string;
  title: string;
  message: string;
  type: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}
