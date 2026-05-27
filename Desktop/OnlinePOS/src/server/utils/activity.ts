import { prisma } from "@/lib/prisma";

export async function logActivity(params: {
  businessId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
}) {
  await prisma.activityLog.create({
    data: {
      businessId: params.businessId,
      userId: params.userId ?? undefined,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      details: params.details,
    },
  });
}
