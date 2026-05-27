import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/server/utils/api-response";
import { withBusinessAuth, parseJsonBody } from "@/server/utils/with-auth";

export async function GET(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const notifications = await prisma.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return apiSuccess(notifications, "Notifications fetched");
  });
}

export async function PATCH(request: Request) {
  return withBusinessAuth(request, async (businessId) => {
    const body = (await parseJsonBody(request)) as {
      ids?: string[];
      markAllRead?: boolean;
    };

    if (body.markAllRead) {
      await prisma.notification.updateMany({
        where: { businessId, read: false },
        data: { read: true },
      });
    } else if (body.ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: body.ids }, businessId },
        data: { read: true },
      });
    }

    return apiSuccess(null, "Notifications updated");
  });
}
